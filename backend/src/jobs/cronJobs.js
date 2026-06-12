const cron = require('node-cron');
const db = require('../config/db');
const logger = require('../config/logger');

/**
 * Initializes all background cron schedules
 */
const initCronJobs = () => {
  logger.info('Initializing enterprise background cron schedules...');

  // 1. Daily Pending Leave Checker (Runs at 09:00 AM every day)
  cron.schedule('0 9 * * *', async () => {
    logger.info('[CRON JOB] Starting daily leave application review reminder...');
    try {
      const pendingLeaves = await db.query(
        "SELECT la.id, ep.first_name, ep.last_name, la.start_date FROM leave_applications la JOIN employee_profiles ep ON la.employee_profile_id = ep.id WHERE la.status LIKE 'pending%'"
      );

      if (pendingLeaves.rows.length > 0) {
        logger.info(`[CRON REMINDER] There are currently ${pendingLeaves.rows.length} leave applications pending approval.`);
      } else {
        logger.debug('[CRON] No pending leave applications found today.');
      }
    } catch (err) {
      logger.error('[CRON ERROR] Failed to query pending leave applications: ', err);
    }
  });

  // 2. Daily System Registry Audit & Health Log (Runs at midnight: 00:00 AM)
  cron.schedule('0 0 * * *', async () => {
    logger.info('[CRON JOB] Compiling daily registry health report...');
    try {
      const empRes = await db.query('SELECT COUNT(*) FROM employee_profiles');
      const assetRes = await db.query('SELECT COUNT(*) FROM assets');
      const allocatedAssetRes = await db.query("SELECT COUNT(*) FROM assets WHERE status = 'allocated'");

      logger.info(`[CRON REPORT] System Health Summary:
        - Total Employees: ${empRes.rows[0].count}
        - Total Asset Catalog Size: ${assetRes.rows[0].count}
        - Allocated Assets: ${allocatedAssetRes.rows[0].count} (Available: ${parseInt(assetRes.rows[0].count) - parseInt(allocatedAssetRes.rows[0].count)})
      `);
    } catch (err) {
      logger.error('[CRON ERROR] Failed to compile daily report stats: ', err);
    }
  });
};

module.exports = {
  initCronJobs
};
