const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin', 'hr', 'manager'));

router.get('/stats', dashboardController.getStats);
router.get('/charts', dashboardController.getChartData);
router.get('/reports', dashboardController.getReports);

module.exports = router;
