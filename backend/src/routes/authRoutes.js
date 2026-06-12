const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { signupSchema, loginSchema, refreshSchema } = require('../validators/authValidator');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public auth endpoints
router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authController.logout);

// Protected endpoint
router.get('/profile', protect, authController.getProfile);

module.exports = router;
