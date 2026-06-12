const express = require('express');
const leaveController = require('../controllers/leaveController');
const validate = require('../middleware/validate');
const { applyLeaveSchema, approveLeaveSchema } = require('../validators/leaveValidator');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Balance endpoints
router.get('/balances/me', leaveController.getMyBalances);
router.get('/balances/employee/:id', restrictTo('admin', 'hr', 'manager'), leaveController.getBalancesByEmployeeId);

// Application endpoints
router.get('/applications', leaveController.getApplications);
router.post('/applications/apply', validate(applyLeaveSchema), leaveController.applyLeave);
router.put('/applications/:id/approve', restrictTo('admin', 'hr', 'manager'), validate(approveLeaveSchema), leaveController.approveLeave);
router.get('/applications/:id/history', leaveController.getApprovalLogs);

// Configs
router.get('/types', leaveController.getLeaveTypes);

module.exports = router;
