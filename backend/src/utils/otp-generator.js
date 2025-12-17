const crypto = require('crypto');

/**
 * Generate 6-digit OTP
 * @returns {string} - 6-digit OTP code
 */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

module.exports = { generateOTP };
