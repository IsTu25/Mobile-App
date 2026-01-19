require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('📧 Testing Email Configuration...');

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const service = process.env.EMAIL_SERVICE || 'gmail';

    console.log(`User: ${user ? '✅ Present (' + user + ')' : '❌ MISSING'}`);
    console.log(`Pass: ${pass ? '✅ Present' : '❌ MISSING'}`);
    console.log(`Service: ${service}`);

    if (!user || !pass) {
        console.error('❌ Cannot test email: Missing credentials in .env');
        return;
    }

    const transporter = nodemailer.createTransport({
        service: service,
        auth: {
            user: user,
            pass: pass
        }
    });

    try {
        console.log('Attempting to verify transporter...');
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');

        console.log('Attempting to send test email to self...');
        const info = await transporter.sendMail({
            from: user,
            to: user, // Send to self
            subject: 'Nirapotta Email Test',
            text: 'If you receive this, the email system is working correctly.'
        });
        console.log('✅ Test Email Sent!', info.messageId);
    } catch (error) {
        console.error('❌ Email Test Failed:', error.message);
        if (error.code === 'EAUTH') {
            console.error('💡 Hint: Check your App Password if using Gmail (2FA enabled).');
        }
    }
}

testEmail();
