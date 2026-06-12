const leaveService = require('../services/leaveService');
const employeeRepository = require('../repositories/employeeRepository');
const AppError = require('../utils/appError');

class LeaveController {
  async getMyBalances(req, res, next) {
    try {
      const employee = await employeeRepository.findByUserId(req.user.id);
      if (!employee) {
        return next(new AppError('Employee profile not found', 404));
      }

      const balances = await leaveService.getLeaveBalances(employee.employee_profile_id);
      res.status(200).json({
        status: 'success',
        data: { balances }
      });
    } catch (err) {
      next(err);
    }
  }

  async getBalancesByEmployeeId(req, res, next) {
    try {
      const { id } = req.params;
      const balances = await leaveService.getLeaveBalances(id);
      res.status(200).json({
        status: 'success',
        data: { balances }
      });
    } catch (err) {
      next(err);
    }
  }

  async getApplications(req, res, next) {
    try {
      // HR/Admin/Manager can filter by employee id or status. Employees can only view their own
      const filters = {};
      if (req.user.role === 'employee') {
        const employee = await employeeRepository.findByUserId(req.user.id);
        if (!employee) {
          return next(new AppError('Employee profile not found', 404));
        }
        filters.employeeProfileId = employee.employee_profile_id;
      } else {
        // managers/HR can supply a query filter for employeeProfileId
        if (req.query.employeeProfileId) {
          filters.employeeProfileId = req.query.employeeProfileId;
        }
        if (req.query.status) {
          filters.status = req.query.status;
        }
      }

      const applications = await leaveService.getLeaveApplications(filters);

      res.status(200).json({
        status: 'success',
        results: applications.length,
        data: { applications }
      });
    } catch (err) {
      next(err);
    }
  }

  async applyLeave(req, res, next) {
    try {
      const application = await leaveService.applyLeave(req.user.id, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Leave applied successfully',
        data: { application }
      });
    } catch (err) {
      next(err);
    }
  }

  async approveLeave(req, res, next) {
    try {
      const { id } = req.params;
      const { action, comments } = req.body;
      const result = await leaveService.approveLeave(id, req.user, { action, comments });

      res.status(200).json({
        status: 'success',
        message: `Leave application successfully ${action}ed`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getApprovalLogs(req, res, next) {
    try {
      const { id } = req.params;
      const logs = await leaveService.getApprovalHistoryLogs(id);
      res.status(200).json({
        status: 'success',
        data: { logs }
      });
    } catch (err) {
      next(err);
    }
  }

  async getLeaveTypes(req, res, next) {
    try {
      const leaveTypes = await leaveService.getLeaveTypes();
      res.status(200).json({
        status: 'success',
        data: { leaveTypes }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LeaveController();
