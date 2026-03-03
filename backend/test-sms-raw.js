const axios = require('axios');
require('dotenv').config();

async function testRaw() {
    console.log('--- SMS RAW API Test ---');
    const apiKey = process.env.SMS_NET_BD_API_KEY;
    const phone = '01798126118';
    const message = 'Test SMS from Nirapotta';

    try {
        const response = await axios.post('https://api.sms.net.bd/sendsms', {
            api_key: apiKey,
            msg: message,
            to: phone
        });
        console.log('API Response:', response.data);
    } catch (e) {
        console.error('Network Error:', e.message);
    }
}
testRaw();
