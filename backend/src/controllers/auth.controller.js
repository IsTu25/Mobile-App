const authService = require('../services/auth.service');

class AuthController {
  /**
   * Send OTP to email
   * POST /api/auth/send-email-otp
   */
  async sendEmailOTP(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const result = await authService.sendEmailOTP(email);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send OTP to phone number
   * POST /api/auth/send-otp
   */
  async sendOTP(req, res, next) {
    try {
      const { phoneNumber } = req.body;

      console.log('📲 OTP Request received for:', phoneNumber);

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      const result = await authService.sendPhoneOTP(phoneNumber);

      console.log('✅ OTP sent successfully to:', phoneNumber);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify OTP and register/login user
   * POST /api/auth/verify-otp
   */
  async verifyOTP(req, res, next) {
    try {
      const { phoneNumber, otp, fullName, email } = req.body;

      if (!phoneNumber || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and OTP are required'
        });
      }

      const result = await authService.verifyOTP(phoneNumber, otp, fullName, email);

      res.status(200).json({
        success: true,
        message: result.isNewUser ? 'Registration successful' : 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Verify Email OTP
   * POST /api/auth/verify-email-otp
   */
  async verifyEmailOTP(req, res, next) {
    try {
      const { email, otp } = req.body;
      const userId = req.userId; // valid because this will be a protected route

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Email and OTP are required'
        });
      }

      const result = await authService.verifyEmailOTP(userId, email, otp);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Setup app security (PIN/Password)
   * POST /api/auth/app-security/setup
   */
  async setupAppSecurity(req, res, next) {
    try {
      const { type, secret } = req.body;
      const userId = req.userId;

      if (!type || !secret) {
        return res.status(400).json({
          success: false,
          message: 'Security type and secret are required'
        });
      }

      const result = await authService.setupAppSecurity(userId, type, secret);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify app security
   * POST /api/auth/app-security/verify
   */
  async verifyAppSecurity(req, res, next) {
    try {
      const { secret } = req.body;
      const userId = req.userId;

      if (!secret) {
        return res.status(400).json({
          success: false,
          message: 'Secret is required'
        });
      }

      const result = await authService.verifyAppSecurity(userId, secret);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh-token
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      const result = await authService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  async getProfile(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        data: {
          user: authService.sanitizeUser(req.user)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update FCM token
   * POST /api/auth/fcm-token
   */
  async updateFCMToken(req, res, next) {
    try {
      const { fcmToken } = req.body;
      const userId = req.userId;

      if (!fcmToken) {
        return res.status(400).json({
          success: false,
          message: 'FCM token is required'
        });
      }

      await authService.updateFCMToken(userId, fcmToken);

      res.status(200).json({
        success: true,
        message: 'FCM token updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { phoneNumber, password, fullName, email, otp, emailOtp } = req.body;

      if (!phoneNumber || !password || !fullName || !otp || !emailOtp) {
        return res.status(400).json({
          success: false,
          message: 'Phone number, password, full name, phone OTP, and email OTP are required'
        });
      }

      const result = await authService.register({
        phoneNumber,
        password,
        fullName,
        email,
        otp,
        emailOtp
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { phoneNumber, password } = req.body;

      if (!phoneNumber || !password) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and password are required'
        });
      }

      const result = await authService.login(phoneNumber, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const userId = req.userId; // Provided by authenticateToken middleware
      await authService.logout(userId);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
