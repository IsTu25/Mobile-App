const axios = require('axios');

async function testPoliceAPI() {
    const BASE_URL = 'http://localhost:3000'; // Using localhost for local test 

    console.log('\n🚨 Testing Police Station API Endpoint\n');

    try {
        // Test with BUET coordinates
        const response = await axios.get(`${BASE_URL}/api/police/nearest`, {
            params: {
                lat: 23.7263,
                lon: 90.3925
            }
        });

        const station = response.data.data;
        console.log(`✅ Success! Found nearest station:`);
        console.log(`   Name: ${station.name}`);
        console.log(`   Distance: ${station.distanceKm} km`);
        console.log(`   Contact: ${station.phone}`);

    } catch (error) {
        console.error('❌ API Error:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

testPoliceAPI();
