const axios = require('axios');
require('dotenv').config();

async function testGet() {
    console.log('--- SMS RAW GET Test ---');
    const apiKey = process.env.SMS_NET_BD_API_KEY;
    const phone = '01798126118';
    const message = encodeURIComponent('Test SMS from Nirapotta');

    try {
        const url = `https://api.sms.net.bd/sendsms?api_key=${apiKey}&to=${phone}&msg=${message}`;
        const response = await axios.get(url);
        console.log('API Response:', response.data);
    } catch (e) {
        console.error('Network Error:', e.message);
    }
}
testGet();
