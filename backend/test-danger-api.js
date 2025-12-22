const axios = require('axios');

// Test the danger prediction API
async function testDangerAPI() {
    const BASE_URL = 'http://192.168.0.104:3000';

    // Test coordinates (Dhaka, Bangladesh)
    const testLocations = [
        { name: 'BUET', lat: 23.7263, lon: 90.3925 },
        { name: 'Gulshan', lat: 23.7808, lon: 90.4161 },
        { name: 'Dhanmondi', lat: 23.7465, lon: 90.3765 },
        { name: 'Demra (Safe)', lat: 23.7456, lon: 90.5234 }
    ];

    console.log('\n🧪 Testing Danger Prediction API\n');
    console.log('='.repeat(60));

    for (const location of testLocations) {
        console.log(`\n📍 Testing: ${location.name}`);
        console.log(`   Coordinates: ${location.lat}, ${location.lon}`);

        try {
            const response = await axios.post(`${BASE_URL}/api/danger/risk-score`, {
                latitude: location.lat,
                longitude: location.lon
            });

            const data = response.data.data;

            console.log(`\n   ✅ Response:`);
            console.log(`   Risk Score: ${data.riskScore}/100`);
            console.log(`   Risk Level: ${data.riskLevel}`);

            if (data.location && data.location.nearestHotspot) {
                console.log(`   Nearest Hotspot: ${data.location.nearestHotspot.name}`);
                console.log(`   Distance: ${(data.location.nearestHotspot.distance / 1000).toFixed(2)}km`);
                console.log(`   Hotspot Risk: ${data.location.nearestHotspot.riskLevel}/100`);
            }

            if (data.breakdown) {
                console.log(`\n   📊 Breakdown:`);
                console.log(`      Hotspot Risk: ${data.breakdown.hotspotRisk}/100`);
                console.log(`      Historical Risk: ${data.breakdown.historicalRisk}/100`);
                console.log(`      Time Risk: ${data.breakdown.timeRisk}/100`);
                console.log(`      Day Risk: ${data.breakdown.dayRisk}/100`);
            }

            if (data.factors && data.factors.length > 0) {
                console.log(`\n   ⚠️  Risk Factors:`);
                data.factors.forEach(f => {
                    console.log(`      • ${f.description} (weight: ${f.weight}%)`);
                });
            }

            if (data.nearbyIncidents) {
                console.log(`\n   📍 Nearby Incidents: ${data.nearbyIncidents.length}`);
            }

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Data:`, error.response.data);
            }
        }

        console.log('\n' + '-'.repeat(60));
    }
}

testDangerAPI().catch(console.error);
