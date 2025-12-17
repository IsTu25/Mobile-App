const rateLimit = require('express-rate-limit');
const config = require('../config/env');

/**
 * General API rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for OTP requests
 */
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour (increased for development)
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 1 hour.'
  },
  keyGenerator: (req) => {
    // Rate limit by phone number if provided, otherwise use default IP handling
    if (req.body.phoneNumber) {
      return `phone:${req.body.phoneNumber}`;
    }
    // Return undefined to use the default IP-based key generator
    return undefined;
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
});

/**
 * Rate limiter for auth endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  otpLimiter,
  authLimiter
};
