const SMSService = require('./src/services/sms.service');
require('dotenv').config();

async function testFormats() {
    console.log('--- SMS Target Number Format Test ---');
    const target = '01837121760';
    // 1. Current logic (8801...)
    // 2. Local logic (01...)
    // 3. International (+8801...)

    const formats = [
        '8801837121760',
        '01837121760',
        '+8801837121760'
    ];

    const axios = require('axios');
    const apiKey = process.env.SMS_NET_BD_API_KEY;

    for (const phone of formats) {
        console.log(`\nTesting format: "${phone}"`);
        try {
            const response = await axios.post('https://api.sms.net.bd/sendsms', {
                api_key: apiKey,
                msg: 'Nirapotta Test',
                to: phone
            });
            console.log('API Response:', response.data);
        } catch (e) {
            console.error('Failed:', e.message);
        }
    }
}
testFormats();
