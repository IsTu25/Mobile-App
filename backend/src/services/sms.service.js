const config = require('../config/env');
const axios = require('axios');

// Mock SMS service or Twilio integration
let twilioClient = null;

if (config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio client initialized for WhatsApp');
  } catch (e) {
    console.error('Failed to init Twilio:', e.message);
  }
}

class SMSService {
  /**
   * Helper to format phone number to E.164 (BD default)
   */
  _formatPhone(phone) {
    if (!phone) return phone;
    // Remove any non-digit characters except +
    let clean = phone.replace(/[^\d+]/g, '');

    // If starts with 01 (BD format), add +88
    if (clean.startsWith('01')) {
      return '+88' + clean;
    }

    // If no + prefix, assume it might need country code or is already valid?
    // For safety in BD context:
    if (!clean.startsWith('+') && clean.length === 11) {
      return '+88' + clean;
    }

    return clean;
  }

  /**
   * Send OTP SMS
   */
  async sendOTP(phoneNumber, otp) {
    try {
      const formattedPhone = this._formatPhone(phoneNumber);
      const message = `Your Safety App verification code is: ${otp}. Valid for ${config.OTP_EXPIRY_MINUTES} minutes. Do not share this code.`;

      if (config.SMS_PROVIDER === 'sms_net_bd') {
        // SMS.Net.BD Integration
        // Remove + from phone number if present for this provider
        const cleanPhone = formattedPhone.replace(/^\+/, '');

        const response = await axios.post('https://api.sms.net.bd/sendsms', {
          api_key: config.SMS_NET_BD_API_KEY,
          msg: message,
          to: cleanPhone
        });

        if (response.data && response.data.error === 0) {
          console.log(`✅ OTP SMS sent via sms.net.bd to ${cleanPhone}`);
          return {
            success: true,
            messageId: response.data.request_id || 'sms-net-bd-id'
          };
        } else {
          console.error('❌ sms.net.bd failure:', response.data);
          throw new Error(response.data.msg || `SMS sending failed with code: ${response.data.error}`);
        }

      } else if (twilioClient) {
        const result = await twilioClient.messages.create({
          body: message,
          from: config.TWILIO_PHONE_NUMBER,
          to: formattedPhone
        });

        console.log(`✅ OTP SMS sent to ${formattedPhone} (SID: ${result.sid})`);
        return {
          success: true,
          messageId: result.sid
        };
      } else {
        // Mock mode for development
        console.log(`📱 Mock SMS to ${formattedPhone}: ${message}`);
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
  async sendEmergencyAlert(phoneNumber, userName, locationUrl, coordinatesStr = "") {
    try {
      const formattedPhone = this._formatPhone(phoneNumber);
      let message = `🚨 EMERGENCY ALERT: ${userName} has triggered an SOS alert. Track their location: ${locationUrl}`;
      if (coordinatesStr) {
        message += `\nLoc: ${coordinatesStr}`;
      }

      if (config.SMS_PROVIDER === 'sms_net_bd') {
        // SMS.Net.BD Integration
        const cleanPhone = formattedPhone.replace(/^\+/, '');

        const response = await axios.post('https://api.sms.net.bd/sendsms', {
          api_key: config.SMS_NET_BD_API_KEY,
          msg: message,
          to: cleanPhone
        });

        if (response.data && !response.data.error) {
          console.log(`✅ Emergency SMS sent via sms.net.bd to ${cleanPhone}`);
          return {
            success: true,
            messageId: response.data.request_id || 'sms-net-bd-id'
          };
        } else {
          // If error, log it but don't crash, maybe fallback or return failure
          console.error('❌ sms.net.bd Error:', response.data);
          return { success: false, error: response.data.msg };
        }

      } else if (twilioClient) {
        const result = await twilioClient.messages.create({
          body: message,
          from: config.TWILIO_PHONE_NUMBER,
          to: formattedPhone
        });

        console.log(`✅ Emergency SMS sent to ${formattedPhone}`);
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
  /**
   * Send WhatsApp Message (Video/Evidence)
   */
  async sendWhatsAppMessage(to, message, mediaUrl) {
    try {
      // Ensure number has country code (BD default)
      let formattedTo = to;
      if (!to.startsWith('+')) {
        formattedTo = '+88' + to;
      }

      if (twilioClient) {
        // Twilio expects 'whatsapp:+1234567890'
        // Twilio expects 'whatsapp:+1234567890'
        const sender = config.TWILIO_WHATSAPP_NUMBER || config.TWILIO_PHONE_NUMBER;
        const fromNumber = sender.startsWith('whatsapp:')
          ? sender
          : `whatsapp:${sender}`;

        const toNumber = `whatsapp:${formattedTo}`;

        const messageOptions = {
          body: message,
          from: fromNumber,
          to: toNumber
        };

        const result = await twilioClient.messages.create(messageOptions);

        console.log(`✅ WhatsApp message sent to ${toNumber} (SID: ${result.sid})`);
        return { success: true, messageId: result.sid };
      } else {
        console.log(`📱 Mock WhatsApp to ${formattedTo}: ${message}`);
        if (mediaUrl) console.log(`   (Media: ${mediaUrl})`);
        return { success: true, mock: true };
      }
    } catch (error) {
      console.error('❌ WhatsApp Error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SMSService();
