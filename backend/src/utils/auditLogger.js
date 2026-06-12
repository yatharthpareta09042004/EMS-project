const db = require('../config/db');
const logger = require('../config/logger');

/**
 * Enterprise System Audit Logger
 * Saves state transitions (old vs new JSON payloads) to the database audit log.
 */
const logAudit = async (userId, actionType, tableName, oldData, newData, req = null) => {
  const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
  const userAgent = req ? req.headers['user-agent'] : null;

  try {
    const queryText = `
      INSERT INTO audit_logs (user_id, action_type, table_name, old_data, new_data, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    await db.query(queryText, [
      userId || null,
      actionType, // CREATE, UPDATE, DELETE
      tableName,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
      ipAddress,
      userAgent
    ]);
  } catch (err) {
    logger.error('Failed to write database audit log', err);
  }
};

module.exports = {
  logAudit
};
