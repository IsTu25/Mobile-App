const SMSService = require('./src/services/sms.service');
require('dotenv').config();

async function test() {
    console.log('--- SMS Test (Detailed) ---');
    const phones = ['01798126118', '+8801798126118', '8801798126118'];
    const testOTP = '123456';

    for (const phone of phones) {
        console.log(`\nTesting format: "${phone}"`);
        try {
            const result = await SMSService.sendOTP(phone, testOTP);
            console.log('✅ Success:', result);
        } catch (e) {
            console.error('❌ Failed:', e.message);
        }
    }
}
test();
