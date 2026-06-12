require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const logger = require('./src/config/logger');
const db = require('./src/config/db');
const { initCronJobs } = require('./src/jobs/cronJobs');
const globalErrorHandler = require('./src/middleware/errorHandler');
const AppError = require('./src/utils/appError');

// Route Imports
const authRoutes = require('./src/routes/authRoutes');
const employeeRoutes = require('./src/routes/employeeRoutes');
const leaveRoutes = require('./src/routes/leaveRoutes');
const assetRoutes = require('./src/routes/assetRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const healthRoutes = require('./src/routes/healthRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 1. SECURITY & MIDDLEWARES
// ==========================================

// Secure HTTP Headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(cors({
  origin: '*', // In production, replace with specific domains
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request payload parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded document attachments
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple request logging middleware
app.use((req, res, next) => {
  logger.info(`--> ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Global API rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Max 500 requests per 15 mins
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// ==========================================
// 2. ROUTING (API VERSION 1)
// ==========================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/health-check', healthRoutes); // Public health check

// Catch-all for undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ==========================================
// 3. ERROR HANDLING & SCHEDULERS
// ==========================================

// Global Express Error Middleware
app.use(globalErrorHandler);

// Start background cron engines
initCronJobs();

// ==========================================
// 4. SERVER BOOTSTRAP
// ==========================================
const server = app.listen(PORT, async () => {
  logger.info(`===============================================`);
  logger.info(`Server initialized and running on port ${PORT}`);
  logger.info(`Environment mode: ${process.env.NODE_ENV}`);
  
  // Test DB connection on startup
  const dbHealth = await db.testConnection();
  if (dbHealth.connected) {
    logger.info(`PostgreSQL Connection: SUCCESSFUL`);
  } else {
    logger.error(`PostgreSQL Connection: FAILED. Check credentials.`);
    logger.error(`Error: ${dbHealth.error}`);
    logger.info(`App will continue running, but DB queries will fail until credentials are corrected.`);
  }
  logger.info(`===============================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down server gracefully...', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down server gracefully...', err);
  process.exit(1);
});

module.exports = app; // For testing suites
