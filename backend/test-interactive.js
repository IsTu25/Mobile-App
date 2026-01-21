const axios = require('axios');

/**
 * Interactive Danger Prediction Test
 * Usage: node test-interactive.js <latitude> <longitude>
 * Example: node test-interactive.js 23.8754 90.3965
 */

const BASE_URL = 'http://192.168.0.148:3000';

async function testLocation(lat, lon) {
    console.log('\n🧪 Testing Danger Prediction API\n');
    console.log('='.repeat(60));
    console.log(`📍 Testing Coordinates: ${lat}, ${lon}`);
    console.log('='.repeat(60));

    try {
        const response = await axios.post(`${BASE_URL}/api/danger/risk-score`, {
            latitude: parseFloat(lat),
            longitude: parseFloat(lon)
        });

        const data = response.data.data;

        console.log(`\n✅ API Response:\n`);
        console.log(`Risk Score: ${data.riskScore}/100`);
        console.log(`Risk Level: ${data.riskLevel.toUpperCase()}`);

        // Color coding
        const colorEmoji =
            data.riskScore >= 75 ? '🔴' :
                data.riskScore >= 60 ? '🟠' :
                    data.riskScore >= 40 ? '🟡' : '🟢';

        console.log(`Status: ${colorEmoji} ${data.riskLevel.toUpperCase()}`);

        // Current zone
        if (data.location && data.location.currentZone) {
            console.log(`\n📍 Current Zone: ${data.location.currentZone.name}`);
            console.log(`   Type: ${data.location.currentZone.type}`);
        }

        // Nearest hotspot
        if (data.location && data.location.nearestHotspot) {
            const distanceKm = (data.location.nearestHotspot.distance / 1000).toFixed(2);
            console.log(`\n🎯 Nearest Danger Zone:`);
            console.log(`   Name: ${data.location.nearestHotspot.name}`);
            console.log(`   Distance: ${distanceKm}km away`);
            console.log(`   Risk Level: ${data.location.nearestHotspot.riskLevel}/100`);
        }

        // Risk breakdown
        if (data.breakdown) {
            console.log(`\n📊 Risk Breakdown:`);
            console.log(`   Hotspot Proximity: ${data.breakdown.hotspotRisk}/100`);
            console.log(`   Historical Crimes: ${data.breakdown.historicalRisk}/100`);
            console.log(`   Time Factor: ${data.breakdown.timeRisk}/100`);
            console.log(`   Day Factor: ${data.breakdown.dayRisk}/100`);
        }

        // Risk factors
        if (data.factors && data.factors.length > 0) {
            console.log(`\n⚠️  Risk Factors:`);
            data.factors.forEach(f => {
                console.log(`   • ${f.description} (${f.weight}% weight)`);
            });
        }

        // Nearby incidents
        if (data.nearbyIncidents && data.nearbyIncidents.length > 0) {
            console.log(`\n📍 Recent Incidents: ${data.nearbyIncidents.length} within 2km`);
            data.nearbyIncidents.slice(0, 3).forEach((incident, i) => {
                const distKm = (incident.distance / 1000).toFixed(2);
                console.log(`   ${i + 1}. ${incident.crimeType} - ${distKm}km away (${incident.date})`);
            });
        }

        // Recommendation
        console.log(`\n💡 Recommendation:`);
        if (data.riskScore >= 75) {
            console.log(`   🚨 DANGER ZONE - Leave this area immediately!`);
        } else if (data.riskScore >= 60) {
            console.log(`   ⚠️  HIGH RISK - Be very cautious, avoid if possible`);
        } else if (data.riskScore >= 40) {
            console.log(`   ⚡ MEDIUM RISK - Stay alert and aware`);
        } else {
            console.log(`   ✅ SAFE ZONE - Low risk area`);
        }

        console.log(`\n${'='.repeat(60)}\n`);

    } catch (error) {
        console.log(`\n❌ Error: ${error.message}`);
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Message:`, error.response.data);
        }
        console.log(`\n${'='.repeat(60)}\n`);
    }
}

// Get coordinates from command line arguments
const lat = process.argv[2];
const lon = process.argv[3];

if (!lat || !lon) {
    console.log('\n❌ Error: Missing coordinates!\n');
    console.log('Usage: node test-interactive.js <latitude> <longitude>');
    console.log('\nExamples:');
    console.log('  node test-interactive.js 23.8754 90.3965  (Uttara)');
    console.log('  node test-interactive.js 23.7808 90.4161  (Gulshan)');
    console.log('  node test-interactive.js 23.7465 90.3765  (Dhanmondi)');
    console.log('\nTip: Get coordinates from Google Maps:');
    console.log('  1. Right-click on any location');
    console.log('  2. Click the coordinates to copy them');
    console.log('  3. Paste them here!\n');
    process.exit(1);
}

// Validate coordinates
if (isNaN(lat) || isNaN(lon)) {
    console.log('\n❌ Error: Invalid coordinates!');
    console.log('Latitude and longitude must be numbers.\n');
    process.exit(1);
}

// Run the test
testLocation(lat, lon);
