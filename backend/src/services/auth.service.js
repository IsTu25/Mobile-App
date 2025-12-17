const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateId } = require('../utils/id-generator');
const { generateOTP } = require('../utils/otp-generator');
const smsService = require('./sms.service');
const emailService = require('./email.service');
const config = require('../config/env');

class AuthService {
  /**
   * Register/Login with phone number (send OTP)
   */

  async sendPhoneOTP(phoneNumber) {
    // Normalize phone number (Default to BD +880 if missing)
    let formattedNumber = phoneNumber;
    if (formattedNumber.startsWith('01')) {
      formattedNumber = '+88' + formattedNumber;
    }

    // Rate limiting check (max 3 OTPs per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOTPs = await OTP.countDocuments({
      phoneNumber: formattedNumber,
      createdAt: { $gte: oneHourAgo }
    });

    if (recentOTPs >= 3) {
      throw new Error('Too many OTP requests. Please try after 1 hour.');
    }

    // Generate OTP
    const otpCode = generateOTP();

    // Save OTP to database
    const expiryTime = new Date(
      Date.now() + config.OTP_EXPIRY_MINUTES * 60 * 1000
    );

    await OTP.create({
      phoneNumber: formattedNumber,
      otp: otpCode,
      expiresAt: expiryTime
    });

    // Always log OTP for development
    console.log(`🔐 OTP for ${formattedNumber}: ${otpCode}`);

    // Send SMS (non-blocking for development)
    try {
      await smsService.sendOTP(formattedNumber, otpCode);
    } catch (smsError) {
      console.error('⚠️  SMS sending failed:', smsError.message);
      // Continue anyway - OTP is saved in database and can be verified
    }


    return {
      message: 'OTP sent successfully',
      expiresIn: config.OTP_EXPIRY_MINUTES + ' minutes'
    };
  }

  /**
   * Send OTP to email
   */
  async sendEmailOTP(email) {
    // Generate OTP
    const otpCode = generateOTP();

    // Save OTP to database
    const expiryTime = new Date(
      Date.now() + config.OTP_EXPIRY_MINUTES * 60 * 1000
    );

    await OTP.create({
      email,
      type: 'email',
      otp: otpCode,
      expiresAt: expiryTime
    });

    console.log(`🔐 Email OTP for ${email}: ${otpCode}`);

    // Send Email
    await emailService.sendOTP(email, otpCode);

    return {
      message: 'Email OTP sent successfully',
      expiresIn: config.OTP_EXPIRY_MINUTES + ' minutes'
    };
  }

  /**
   * Logout user (clear refresh token)
   */
  async logout(userId) {
    if (!userId) return;

    await User.findOneAndUpdate(
      { userId },
      { $unset: { refreshToken: 1 } }
    );
  }

  /**
   * Verify OTP and create/login user
   */
  async verifyOTP(phoneNumber, otpCode, fullName = null, email = null) {
    // Normalize phone number
    let formattedNumber = phoneNumber;
    if (formattedNumber.startsWith('01')) {
      formattedNumber = '+88' + formattedNumber;
    }

    // Find OTP
    const otpRecord = await OTP.findOne({
      phoneNumber: formattedNumber,
      otp: otpCode,
      type: 'phone', // Default type
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      throw new Error('Invalid or expired OTP');
    }

    // Check attempts
    if (otpRecord.attempts >= config.MAX_OTP_ATTEMPTS) {
      throw new Error('Maximum OTP attempts exceeded');
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Find or create user
    let user = await User.findOne({ phoneNumber: formattedNumber });
    let isNewUser = false;

    if (!user) {
      // Create new user
      if (!fullName) {
        throw new Error('Full name required for new registration');
      }

      user = new User({
        userId: generateId('USR'),
        phoneNumber: formattedNumber,
        email: email, // Save email if provided
        fullName,
        isVerified: true
      });

      await user.save();
      isNewUser = true;
      console.log(`✅ New user registered: ${formattedNumber}`);
    } else {
      console.log(`✅ User logged in: ${formattedNumber}`);
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return {
      user: this.sanitizeUser(user),
      tokens,
      isNewUser
    };
  }

  /**
   * Verify Email OTP
   */
  async verifyEmailOTP(userId, email, otpCode) {
    const otpRecord = await OTP.findOne({
      email,
      type: 'email',
      otp: otpCode,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      throw new Error('Invalid or expired Email OTP');
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Update User
    await User.findOneAndUpdate(
      { userId },
      { isEmailVerified: true, email: email } // Ensure email is set/consistent
    );

    return {
      success: true,
      message: 'Email verified successfully'
    };
  }

  /**
   * Setup app-level security (PIN/Password)
   */
  async setupAppSecurity(userId, type, secret) {
    const user = await User.findOne({ userId });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate secret format
    if (type === 'pin' && !/^\d{4,6}$/.test(secret)) {
      throw new Error('PIN must be 4-6 digits');
    }

    if (type === 'password' && secret.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    user.appSecurity = {
      enabled: true,
      type,
      hashedSecret: secret // Will be hashed by pre-save hook
    };

    await user.save();

    console.log(`✅ App security setup for user: ${userId}`);

    return {
      message: 'App security setup successful'
    };
  }

  /**
   * Verify app security
   */
  async verifyAppSecurity(userId, secret) {
    const user = await User.findOne({ userId })
      .select('+appSecurity.hashedSecret');

    if (!user || !user.appSecurity.enabled) {
      throw new Error('App security not enabled');
    }

    const isValid = await user.compareAppSecret(secret);

    if (!isValid) {
      throw new Error('Invalid PIN/password');
    }

    return {
      valid: true
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

      const user = await User.findOne({
        userId: decoded.userId
      }).select('+refreshToken');

      if (!user || user.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { userId: user.userId, phoneNumber: user.phoneNumber },
        config.JWT_SECRET,
        { expiresIn: config.JWT_ACCESS_EXPIRY }
      );

      return { accessToken };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Update FCM token for push notifications
   */
  async updateFCMToken(userId, fcmToken) {
    await User.findOneAndUpdate(
      { userId },
      { fcmToken }
    );

    console.log(`✅ FCM token updated for user: ${userId}`);
  }

  /**
   * Generate JWT tokens
   */
  generateTokens(user) {
    const accessToken = jwt.sign(
      { userId: user.userId, phoneNumber: user.phoneNumber },
      config.JWT_SECRET,
      { expiresIn: config.JWT_ACCESS_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId: user.userId },
      config.JWT_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRY }
    );

    return {
      accessToken,
      refreshToken
    };
  }

  /**
   * Remove sensitive fields from user object
   */
  sanitizeUser(user) {
    const userObj = user.toObject();
    delete userObj.refreshToken;
    delete userObj.appSecurity.hashedSecret;
    delete userObj.__v;
    return userObj;
  }
  /**
   * Register with password
   */
  async register(userData) {
    const { phoneNumber, password, fullName, email, otp, emailOtp } = userData;

    // Normalize phone number
    let formattedNumber = phoneNumber;
    if (formattedNumber.startsWith('01')) {
      formattedNumber = '+88' + formattedNumber;
    }

    // 1. Verify Phone OTP
    const otpRecord = await OTP.findOne({
      phoneNumber: formattedNumber,
      otp,
      type: 'phone', // Default type
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      throw new Error('Invalid or expired Phone OTP');
    }

    // Mark Phone OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // 2. Verify Email OTP
    const emailOtpRecord = await OTP.findOne({
      email,
      otp: emailOtp,
      type: 'email',
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!emailOtpRecord) {
      throw new Error('Invalid or expired Email OTP');
    }

    // Mark Email OTP as used
    emailOtpRecord.isUsed = true;
    await emailOtpRecord.save();

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber: formattedNumber });
    if (existingUser) {
      throw new Error('User with this phone number already exists');
    }

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        throw new Error('User with this email already exists');
      }
    }

    // Create user
    const user = new User({
      userId: generateId('USR'),
      phoneNumber: formattedNumber,
      password, // Will be hashed by pre-save hook
      fullName,
      email,
      isVerified: true, // Phone verified
      isEmailVerified: true // Email verified
    });

    await user.save();
    console.log(`✅ New user registered with password: ${formattedNumber}`);

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return {
      user: this.sanitizeUser(user),
      tokens
    };
  }

  /**
   * Login with password
   */
  async login(phoneNumber, password) {
    // Normalize phone number
    let formattedNumber = phoneNumber;
    if (formattedNumber.startsWith('01')) {
      formattedNumber = '+88' + formattedNumber;
    }

    // Find user and select password
    const user = await User.findOne({ phoneNumber: formattedNumber }).select('+password +refreshToken');

    if (!user) {
      throw new Error('User not found');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    console.log(`✅ User logged in with password: ${formattedNumber}`);

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return {
      user: this.sanitizeUser(user),
      tokens
    };
  }
}

module.exports = new AuthService();
