const db = require('../config/db');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const queryText = `
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 50
      `;
      const result = await db.query(queryText, [req.user.id]);
      
      res.status(200).json({
        status: 'success',
        results: result.rows.length,
        data: { notifications: result.rows }
      });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const queryText = `
        UPDATE notifications 
        SET is_read = true 
        WHERE id = $1 AND user_id = $2 
        RETURNING *
      `;
      const result = await db.query(queryText, [id, req.user.id]);

      res.status(200).json({
        status: 'success',
        data: { notification: result.rows[0] }
      });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const queryText = `
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = $1
      `;
      await db.query(queryText, [req.user.id]);

      res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationController();
