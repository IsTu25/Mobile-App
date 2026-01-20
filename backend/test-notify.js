require('dotenv').config();
const smsService = require('./src/services/sms.service');
const nodemailer = require('nodemailer');

const TEST_PHONE = '+8801837121760'; // Your number
const TEST_EMAIL = 'isfakiqbal@iut-dhaka.edu'; // Your email? or the one in seed? 'isfakiqbal@iut-dhaka.edu'

async function testSystem() {
    console.log('🧪 Testing Notification System...');
    console.log('--------------------------------');

    // 1. Test SMS
    try {
        console.log(`📱 Sending SMS to ${TEST_PHONE}...`);
        const smsResult = await smsService.sendEmergencyAlert(TEST_PHONE, 'TestUser', 'http://maps.google.com');
        console.log('SMS Result:', smsResult);
    } catch (e) {
        console.error('❌ SMS Failed:', e.message);
    }

    // 2. Test WhatsApp
    try {
        console.log(`💬 Sending WhatsApp to ${TEST_PHONE}...`);
        const waResult = await smsService.sendWhatsAppMessage(TEST_PHONE, 'Test WhatsApp from Nirapotta System');
        console.log('WhatsApp Result:', waResult);
    } catch (e) {
        console.error('❌ WhatsApp Failed:', e.message);
    }

    // 3. Test Email
    try {
        console.log(`📧 Sending Email to ${TEST_EMAIL}...`);
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: TEST_EMAIL,
            subject: '🧪 Nirapotta System Test',
            text: 'If you are reading this, the email configuration is CORRECT!'
        });
        console.log('✅ Email Sent:', info.messageId);
    } catch (e) {
        console.error('❌ Email Failed:', e);
    }
}

testSystem();
