const express = require('express');
const db = require('../config/db');

const router = express.Router();

/**
 * Basic server / database health checker
 */
router.get('/health', async (req, res) => {
  const dbHealth = await db.testConnection();
  
  const healthStatus = {
    status: dbHealth.connected ? 'UP' : 'DOWN',
    uptime: process.uptime(),
    timestamp: new Date(),
    services: {
      server: 'UP',
      database: dbHealth.connected ? 'CONNECTED' : 'DISCONNECTED'
    },
    system: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  };

  const statusCode = dbHealth.connected ? 200 : 500;
  res.status(statusCode).json(healthStatus);
});

module.exports = router;
