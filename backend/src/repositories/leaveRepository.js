const db = require('../config/db');

class LeaveRepository {
  async findBalance(employeeProfileId, leaveTypeId, year) {
    const queryText = `
      SELECT lb.*, lt.name as leave_type_name 
      FROM leave_balance lb
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.employee_profile_id = $1 AND lb.leave_type_id = $2 AND lb.year = $3
    `;
    const result = await db.query(queryText, [employeeProfileId, leaveTypeId, year]);
    return result.rows[0];
  }

  async findAllBalances(employeeProfileId, year) {
    const queryText = `
      SELECT lb.*, lt.name as leave_type_name, lt.default_days
      FROM leave_balance lb
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.employee_profile_id = $1 AND lb.year = $2
    `;
    const result = await db.query(queryText, [employeeProfileId, year]);
    return result.rows;
  }

  async updateBalance(id, { usedDays, pendingDays }) {
    const queryText = `
      UPDATE leave_balance 
      SET used_days = $1, pending_days = $2
      WHERE id = $3
      RETURNING *
    `;
    const result = await db.query(queryText, [usedDays, pendingDays, id]);
    return result.rows[0];
  }

  async createApplication({ employeeProfileId, leaveTypeId, startDate, endDate, reason }) {
    const queryText = `
      INSERT INTO leave_applications (employee_profile_id, leave_type_id, start_date, end_date, reason, status)
      VALUES ($1, $2, $3, $4, $5, 'pending_manager')
      RETURNING *
    `;
    const result = await db.query(queryText, [employeeProfileId, leaveTypeId, startDate, endDate, reason]);
    return result.rows[0];
  }

  async findApplicationById(id) {
    const queryText = 'SELECT * FROM v_leave_summary WHERE leave_application_id = $1';
    const result = await db.query(queryText, [id]);
    return result.rows[0];
  }

  async updateApplicationStatus(id, status) {
    const queryText = 'UPDATE leave_applications SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
    const result = await db.query(queryText, [status, id]);
    return result.rows[0];
  }

  async createApprovalHistory({ leaveApplicationId, approverId, action, comments }) {
    const queryText = `
      INSERT INTO approval_history (leave_application_id, approver_id, action, comments)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(queryText, [leaveApplicationId, approverId, action, comments]);
    return result.rows[0];
  }

  async getApprovalHistory(leaveApplicationId) {
    const queryText = `
      SELECT ah.*, u.email as approver_email, u.role as approver_role
      FROM approval_history ah
      LEFT JOIN users u ON ah.approver_id = u.id
      WHERE ah.leave_application_id = $1
      ORDER BY ah.timestamp ASC
    `;
    const result = await db.query(queryText, [leaveApplicationId]);
    return result.rows;
  }

  async findAllApplications({ employeeProfileId, status, departmentId }) {
    let queryText = 'SELECT * FROM v_leave_summary WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (employeeProfileId) {
      queryText += ` AND employee_profile_id = $${paramIndex}`;
      params.push(employeeProfileId);
      paramIndex++;
    }

    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    queryText += ' ORDER BY created_at DESC';
    const result = await db.query(queryText, params);
    return result.rows;
  }

  async findAllLeaveTypes() {
    const result = await db.query('SELECT * FROM leave_types ORDER BY id ASC');
    return result.rows;
  }
}

module.exports = new LeaveRepository();
