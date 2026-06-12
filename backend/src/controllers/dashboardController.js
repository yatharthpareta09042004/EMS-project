const db = require('../config/db');

class DashboardController {
  async getStats(req, res, next) {
    try {
      // Execute multiple aggregations concurrently
      const employeesQuery = db.query('SELECT COUNT(*) FROM employee_profiles');
      const deptsQuery = db.query('SELECT COUNT(*) FROM departments');
      const skillsQuery = db.query('SELECT COUNT(*) FROM skills');
      const pendingLeavesQuery = db.query("SELECT COUNT(*) FROM leave_applications WHERE status LIKE 'pending%'");
      const approvedLeavesQuery = db.query("SELECT COUNT(*) FROM leave_applications WHERE status = 'approved'");
      const rejectedLeavesQuery = db.query("SELECT COUNT(*) FROM leave_applications WHERE status = 'rejected'");
      const assetsQuery = db.query('SELECT COUNT(*) FROM assets');
      const salaryQuery = db.query('SELECT SUM(salary) FROM employee_profiles');

      const [
        employeesRes,
        deptsRes,
        skillsRes,
        pendingRes,
        approvedRes,
        rejectedRes,
        assetsRes,
        salaryRes
      ] = await Promise.all([
        employeesQuery,
        deptsQuery,
        skillsQuery,
        pendingLeavesQuery,
        approvedLeavesQuery,
        rejectedLeavesQuery,
        assetsQuery,
        salaryQuery
      ]);

      const totalEmployees = parseInt(employeesRes.rows[0].count);
      const totalDepartments = parseInt(deptsRes.rows[0].count);
      const totalSkills = parseInt(skillsRes.rows[0].count);
      const pendingLeaves = parseInt(pendingRes.rows[0].count);
      const approvedLeaves = parseInt(approvedRes.rows[0].count);
      const rejectedLeaves = parseInt(rejectedRes.rows[0].count);
      const totalAssets = parseInt(assetsRes.rows[0].count);
      const salaryExpense = parseFloat(salaryRes.rows[0].sum || 0);

      res.status(200).json({
        status: 'success',
        data: {
          cards: {
            totalEmployees,
            totalDepartments,
            totalSkills,
            pendingLeaves,
            approvedLeaves,
            rejectedLeaves,
            totalAssets,
            salaryExpense
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getChartData(req, res, next) {
    try {
      // 1. Employees per Department (for Pie Chart)
      const deptDistribution = await db.query(`
        SELECT d.name as department, COUNT(ep.id)::int as count
        FROM departments d
        LEFT JOIN employee_profiles ep ON d.id = ep.department_id
        GROUP BY d.name
      `);

      // 2. Assets by Type (for Bar Chart)
      const assetTypeDistribution = await db.query(`
        SELECT asset_type as type, COUNT(*)::int as count
        FROM assets
        GROUP BY asset_type
      `);

      // 3. Salary Expense by Department (for Area Chart)
      const salaryByDept = await db.query(`
        SELECT d.name as department, COALESCE(SUM(ep.salary), 0)::float as expense
        FROM departments d
        LEFT JOIN employee_profiles ep ON d.id = ep.department_id
        GROUP BY d.name
      `);

      // 4. Leave Applications by Month in 2026 (for Line Chart)
      const leavesTimeline = await db.query(`
        SELECT TO_CHAR(created_at, 'Mon') as month, COUNT(*)::int as count,
               EXTRACT(MONTH FROM created_at) as month_num
        FROM leave_applications
        GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
        ORDER BY month_num ASC
      `);

      res.status(200).json({
        status: 'success',
        data: {
          deptDistribution: deptDistribution.rows,
          assetDistribution: assetTypeDistribution.rows,
          salaryDistribution: salaryByDept.rows,
          leavesTimeline: leavesTimeline.rows
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getReports(req, res, next) {
    try {
      const { reportType } = req.query; // employee, department, leave, asset, salary

      let queryText = '';
      let rows = [];

      switch (reportType) {
        case 'employee':
          queryText = `
            SELECT first_name, last_name, email, designation, department_name, joined_date
            FROM v_employee_details
            ORDER BY joined_date DESC
          `;
          break;
        case 'department':
          queryText = `
            SELECT d.name, d.description, COUNT(ep.id)::int as total_employees, COALESCE(SUM(ep.salary), 0)::float as total_salary
            FROM departments d
            LEFT JOIN employee_profiles ep ON d.id = ep.department_id
            GROUP BY d.name, d.description
          `;
          break;
        case 'leave':
          queryText = `
            SELECT employee_name, department_name, leave_type_name, start_date, end_date, requested_days, status
            FROM v_leave_summary
            ORDER BY created_at DESC
          `;
          break;
        case 'asset':
          queryText = `
            SELECT asset_name, asset_type, serial_number, asset_status, allocated_to_name, allocated_at
            FROM v_asset_details
            ORDER BY asset_id DESC
          `;
          break;
        case 'salary':
          queryText = `
            SELECT first_name, last_name, designation, department_name, salary
            FROM v_employee_details
            ORDER BY salary DESC
          `;
          break;
        default:
          return next(new AppError('Invalid or missing reportType', 400));
      }

      const result = await db.query(queryText);
      rows = result.rows;

      res.status(200).json({
        status: 'success',
        results: rows.length,
        data: { report: rows }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DashboardController();
