const leaveRepository = require('../repositories/leaveRepository');
const employeeRepository = require('../repositories/employeeRepository');
const db = require('../config/db');
const AppError = require('../utils/appError');
const logger = require('../config/logger');

class LeaveService {
  async getLeaveBalances(employeeProfileId, year = new Date().getFullYear()) {
    return await leaveRepository.findAllBalances(employeeProfileId, year);
  }

  async getLeaveApplications(filters) {
    return await leaveRepository.findAllApplications(filters);
  }

  async getLeaveTypes() {
    return await leaveRepository.findAllLeaveTypes();
  }

  /**
   * Submit a new leave application
   */
  async applyLeave(userId, { leaveTypeId, startDate, endDate, reason }) {
    const employee = await employeeRepository.findByUserId(userId);
    if (!employee) {
      throw new AppError('Employee profile not found to apply for leave', 404);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const requestedDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (requestedDays <= 0) {
      throw new AppError('End date must be greater than or equal to start date', 400);
    }

    const year = start.getFullYear();

    const { client, query, release } = await db.getClient();
    try {
      await query('BEGIN');

      // Fetch balance
      const balanceRes = await query(
        'SELECT * FROM leave_balance WHERE employee_profile_id = $1 AND leave_type_id = $2 AND year = $3 FOR UPDATE',
        [employee.employee_profile_id, leaveTypeId, year]
      );
      const balance = balanceRes.rows[0];

      if (!balance) {
        throw new AppError('Leave balance record not found for the requested year', 400);
      }

      const availableDays = balance.total_days - balance.used_days - balance.pending_days;
      if (availableDays < requestedDays) {
        throw new AppError(`Insufficient leave balance. Requested: ${requestedDays}, Available: ${availableDays}`, 400);
      }

      // 1. Update balance (add to pending_days)
      await query(
        'UPDATE leave_balance SET pending_days = pending_days + $1 WHERE id = $2',
        [requestedDays, balance.id]
      );

      // 2. Create Leave Application
      const applicationRes = await query(
        `INSERT INTO leave_applications (employee_profile_id, leave_type_id, start_date, end_date, reason, status)
         VALUES ($1, $2, $3, $4, $5, 'pending_manager') RETURNING *`,
        [employee.employee_profile_id, leaveTypeId, startDate, endDate, reason]
      );
      const application = applicationRes.rows[0];

      // 3. Create Notification for Manager
      const managersRes = await query("SELECT id FROM users WHERE role = 'manager' OR role = 'admin' LIMIT 5");
      for (const mgr of managersRes.rows) {
        await query(
          `INSERT INTO notifications (user_id, message, type, reference_id)
           VALUES ($1, $2, 'leave_applied', $3)`,
          [mgr.id, `${employee.full_name} applied for leave (${requestedDays} days) starting ${startDate}.`, application.id]
        );
      }

      await query('COMMIT');
      return application;
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    } finally {
      release();
    }
  }

  /**
   * Action approvals/rejections through the workflow
   */
  async approveLeave(applicationId, approverUser, { action, comments }) {
    const app = await leaveRepository.findApplicationById(applicationId);
    if (!app) {
      throw new AppError('Leave application not found', 404);
    }

    const start = new Date(app.start_date);
    const end = new Date(app.end_date);
    const requestedDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const year = start.getFullYear();

    const { client, query, release } = await db.getClient();
    try {
      await query('BEGIN');

      // Fetch lock on balance
      const balanceRes = await query(
        'SELECT * FROM leave_balance WHERE employee_profile_id = $1 AND leave_type_id = $2 AND year = $3 FOR UPDATE',
        [app.employee_profile_id, app.leave_type_id, year]
      );
      const balance = balanceRes.rows[0];

      let newStatus = app.status;

      if (approverUser.role === 'manager') {
        if (app.status !== 'pending_manager') {
          throw new AppError('This application is not pending manager approval', 400);
        }
        if (action === 'approve') {
          newStatus = 'pending_hr';
        } else if (action === 'reject') {
          newStatus = 'rejected';
        } else {
          throw new AppError('Invalid manager action', 400);
        }
      } else if (approverUser.role === 'hr' || approverUser.role === 'admin') {
        // HR or Admin can approve pending HR, or bypass manager if they approve/reject
        if (app.status !== 'pending_hr' && app.status !== 'pending_manager') {
          throw new AppError('This application is not in a pending state', 400);
        }
        if (action === 'approve') {
          newStatus = 'approved';
        } else if (action === 'reject') {
          newStatus = 'rejected';
        } else {
          throw new AppError('Invalid HR/Admin action', 400);
        }
      } else {
        throw new AppError('Only Managers, HR, or Admins can approve leaves', 403);
      }

      // Update Leave Application Status
      await query(
        'UPDATE leave_applications SET status = $1, updated_at = NOW() WHERE id = $2',
        [newStatus, applicationId]
      );

      // Log Approval History
      const histAction = `${approverUser.role}_${action}d`; // manager_approved, manager_rejected, hr_approved, hr_rejected
      await query(
        `INSERT INTO approval_history (leave_application_id, approver_id, action, comments)
         VALUES ($1, $2, $3, $4)`,
        [applicationId, approverUser.id, histAction, comments || '']
      );

      // Adjust Leave Balance based on final status
      if (newStatus === 'rejected') {
        // Release pending days back to available
        await query(
          'UPDATE leave_balance SET pending_days = pending_days - $1 WHERE id = $2',
          [requestedDays, balance.id]
        );
      } else if (newStatus === 'approved') {
        // Convert pending days to used days
        await query(
          'UPDATE leave_balance SET pending_days = pending_days - $1, used_days = used_days + $2 WHERE id = $3',
          [requestedDays, requestedDays, balance.id]
        );
      }

      // Notify Employee
      const empProfileRes = await query('SELECT user_id FROM employee_profiles WHERE id = $1', [app.employee_profile_id]);
      const employeeUserId = empProfileRes.rows[0].user_id;
      
      const message = `Your leave request for ${requestedDays} days starting ${app.start_date} was ${action}d by ${approverUser.role}. Status: ${newStatus.replace('_', ' ')}.`;
      await query(
        `INSERT INTO notifications (user_id, message, type, reference_id)
         VALUES ($1, $2, $3, $4)`,
        [employeeUserId, message, `leave_${action}d`, applicationId]
      );

      await query('COMMIT');
      return { status: newStatus, applicationId };
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    } finally {
      release();
    }
  }

  async getApprovalHistoryLogs(applicationId) {
    return await leaveRepository.getApprovalHistory(applicationId);
  }
}

module.exports = new LeaveService();
