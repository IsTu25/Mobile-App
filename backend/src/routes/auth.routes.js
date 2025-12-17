const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { otpLimiter, authLimiter } = require('../middleware/rate-limit.middleware');

// Public routes
router.post('/send-otp', otpLimiter, authController.sendOTP);
router.post('/send-email-otp', otpLimiter, authController.sendEmailOTP);
router.post('/verify-otp', authLimiter, authController.verifyOTP);
router.post('/register', authController.register);
router.post('/login', authController.login); // Login shouldn't have rate limit? Maybe authLimiter.
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.post('/logout', authenticateToken, authController.logout);
router.post('/verify-email-otp', authenticateToken, authController.verifyEmailOTP);
router.post('/app-security/setup', authenticateToken, authController.setupAppSecurity);
router.post('/app-security/verify', authenticateToken, authController.verifyAppSecurity);
router.get('/me', authenticateToken, authController.getProfile);
router.post('/fcm-token', authenticateToken, authController.updateFCMToken);

module.exports = router;
