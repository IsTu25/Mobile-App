const nodemailer = require('nodemailer');
const config = require('../config/env');

class EmailService {
    constructor() {
        this.transporter = null;

        if (config.EMAIL_USER && config.EMAIL_PASS) {
            this.transporter = nodemailer.createTransport({
                service: config.EMAIL_SERVICE,
                auth: {
                    user: config.EMAIL_USER,
                    pass: config.EMAIL_PASS
                }
            });
        }
    }

    /**
     * Send OTP Email
     */
    async sendOTP(email, otp) {
        try {
            const message = {
                from: config.EMAIL_USER,
                to: email,
                subject: 'Nirapotta Verification Code',
                text: `Your Nirapotta verification code is: ${otp}. Valid for ${config.OTP_EXPIRY_MINUTES} minutes. Do not share this code.`,
                html: `<p>Your Nirapotta verification code is: <strong>${otp}</strong>.</p><p>Valid for ${config.OTP_EXPIRY_MINUTES} minutes.</p><p>Do not share this code.</p>`
            };

            if (this.transporter) {
                const info = await this.transporter.sendMail(message);
                console.log(`✅ OTP Email sent to ${email} (MessageID: ${info.messageId})`);
                return {
                    success: true,
                    messageId: info.messageId
                };
            } else {
                // Mock mode
                console.log(`📧 Mock Email to ${email}: ${message.text}`);
                return {
                    success: true,
                    mock: true
                };
            }
        } catch (error) {
            console.error('❌ Email Error:', error);
            throw new Error('Failed to send email');
        }
    }
}

module.exports = new EmailService();
