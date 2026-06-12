const db = require('../config/db');

class UserRepository {
  async findByEmail(email) {
    const queryText = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(queryText, [email]);
    return result.rows[0];
  }

  async findById(id) {
    const queryText = 'SELECT id, email, role, status, created_at, updated_at FROM users WHERE id = $1';
    const result = await db.query(queryText, [id]);
    return result.rows[0];
  }

  async create({ email, passwordHash, role, status = 'active' }) {
    const queryText = `
      INSERT INTO users (email, password_hash, role, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, role, status, created_at
    `;
    const result = await db.query(queryText, [email, passwordHash, role, status]);
    return result.rows[0];
  }

  async updateStatus(id, status) {
    const queryText = 'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status';
    const result = await db.query(queryText, [status, id]);
    return result.rows[0];
  }
}

module.exports = new UserRepository();
