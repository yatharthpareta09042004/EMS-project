const { Pool } = require('pg');
const logger = require('./logger');

const isProd = process.env.NODE_ENV === 'production';

// DB Config options from environment
const poolConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'enterprise_ems',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20, // Max connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// If DATABASE_URL is provided directly (e.g., in Neon/Render), use it
if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
}

const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle database client', err);
});

// A wrapper query function that logs errors
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query: %o', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Database query error: %s - Query: %s', error.message, text);
    throw error;
  }
};

/**
 * Get client for transactions
 */
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  return { client, query, release };
};

/**
 * Health Check helper
 */
const testConnection = async () => {
  try {
    const res = await query('SELECT NOW()');
    return {
      connected: true,
      timestamp: res.rows[0].now
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message
    };
  }
};

module.exports = {
  query,
  getClient,
  testConnection,
  pool
};
