const config = require('../config/env');

// Mock SMS service or Twilio integration
let twilioClient = null;

if (config.SMS_PROVIDER === 'twilio' && config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN) {
  const twilio = require('twilio');
  twilioClient = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
}

class SMSService {
  /**
   * Send OTP SMS
   */
  async sendOTP(phoneNumber, otp) {
    try {
      const message = `Your Safety App verification code is: ${otp}. Valid for ${config.OTP_EXPIRY_MINUTES} minutes. Do not share this code.`;
      
      if (twilioClient) {
        const result = await twilioClient.messages.create({
          body: message,
          from: config.TWILIO_PHONE_NUMBER,
          to: phoneNumber
        });
        
        console.log(`✅ OTP SMS sent to ${phoneNumber} (SID: ${result.sid})`);
        return {
          success: true,
          messageId: result.sid
        };
      } else {
        // Mock mode for development
        console.log(`📱 Mock SMS to ${phoneNumber}: ${message}`);
        console.log(`🔐 OTP Code: ${otp}`);
        return {
          success: true,
          mock: true
        };
      }
    } catch (error) {
      console.error('❌ SMS Error:', error);
      throw new Error('Failed to send SMS');
    }
  }
  
  /**
   * Send emergency alert SMS
   */
  async sendEmergencyAlert(phoneNumber, userName, locationUrl) {
    try {
      const message = `🚨 EMERGENCY ALERT: ${userName} has triggered an SOS alert. Track their location: ${locationUrl}`;
      
      if (twilioClient) {
        const result = await twilioClient.messages.create({
          body: message,
          from: config.TWILIO_PHONE_NUMBER,
          to: phoneNumber
        });
        
        console.log(`✅ Emergency SMS sent to ${phoneNumber}`);
        return {
          success: true,
          messageId: result.sid
        };
      } else {
        // Mock mode
        console.log(`📱 Mock Emergency SMS to ${phoneNumber}: ${message}`);
        return {
          success: true,
          mock: true
        };
      }
    } catch (error) {
      console.error('❌ Emergency SMS Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new SMSService();
