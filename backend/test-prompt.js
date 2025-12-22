const axios = require('axios');
const readline = require('readline');

/**
 * Interactive Danger Prediction Test with User Prompts
 * Just run: node test-prompt.js
 * Then enter coordinates when asked!
 */

const BASE_URL = 'http://192.168.0.104:3000';

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Predefined locations for quick testing
const quickLocations = {
    '1': { name: 'Uttara', lat: 23.8754, lon: 90.3965 },
    '2': { name: 'Gulshan', lat: 23.7808, lon: 90.4161 },
    '3': { name: 'Dhanmondi', lat: 23.7465, lon: 90.3765 },
    '4': { name: 'Mirpur', lat: 23.8223, lon: 90.3654 },
    '5': { name: 'Demra (Safe)', lat: 23.7456, lon: 90.5234 },
    '6': { name: 'Chittagong', lat: 22.3569, lon: 91.7832 },
};

async function testLocation(lat, lon, locationName = 'Custom Location') {
    console.log('\n' + '='.repeat(60));
    console.log(`🧪 Testing: ${locationName}`);
    console.log(`📍 Coordinates: ${lat}, ${lon}`);
    console.log('='.repeat(60));

    try {
        const response = await axios.post(`${BASE_URL}/api/danger/risk-score`, {
            latitude: parseFloat(lat),
            longitude: parseFloat(lon)
        });

        const data = response.data.data;

        // Color coding
        const colorEmoji =
            data.riskScore >= 75 ? '🔴' :
                data.riskScore >= 60 ? '🟠' :
                    data.riskScore >= 40 ? '🟡' : '🟢';

        console.log(`\n${colorEmoji} Risk Score: ${data.riskScore}/100 (${data.riskLevel.toUpperCase()})`);

        if (data.location && data.location.currentZone) {
            console.log(`📍 Current Zone: ${data.location.currentZone.name}`);
        }

        if (data.location && data.location.nearestHotspot) {
            const distanceKm = (data.location.nearestHotspot.distance / 1000).toFixed(2);
            console.log(`🎯 Nearest Danger: ${data.location.nearestHotspot.name} (${distanceKm}km)`);
        }

        if (data.breakdown) {
            console.log(`\n📊 Breakdown: Hotspot(${data.breakdown.hotspotRisk}) | Historical(${data.breakdown.historicalRisk}) | Time(${data.breakdown.timeRisk}) | Day(${data.breakdown.dayRisk})`);
        }

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.log(`\n❌ Error: ${error.message}`);
        console.log('='.repeat(60));
    }
}

function showMenu() {
    console.log('\n' + '='.repeat(60));
    console.log('🗺️  DANGER PREDICTION TESTER');
    console.log('='.repeat(60));
    console.log('\nChoose an option:');
    console.log('\n📍 Quick Test Locations:');
    Object.entries(quickLocations).forEach(([key, loc]) => {
        console.log(`  ${key}. ${loc.name}`);
    });
    console.log('\n  7. Enter custom coordinates');
    console.log('  8. Exit');
    console.log('\n' + '='.repeat(60));
}

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function main() {
    console.log('\n🚀 Interactive Danger Prediction Tester');
    console.log('Test any location in Bangladesh!\n');

    while (true) {
        showMenu();

        const choice = await askQuestion('\nEnter your choice (1-8): ');

        if (choice === '8') {
            console.log('\n👋 Goodbye!\n');
            rl.close();
            break;
        }

        if (quickLocations[choice]) {
            const loc = quickLocations[choice];
            await testLocation(loc.lat, loc.lon, loc.name);

            const again = await askQuestion('\nTest another location? (y/n): ');
            if (again.toLowerCase() !== 'y') {
                console.log('\n👋 Goodbye!\n');
                rl.close();
                break;
            }
        } else if (choice === '7') {
            console.log('\n📍 Enter Custom Coordinates:');
            console.log('Tip: Get coordinates from Google Maps (right-click → copy coordinates)\n');

            const lat = await askQuestion('Latitude (e.g., 23.8754): ');
            const lon = await askQuestion('Longitude (e.g., 90.3965): ');

            if (isNaN(lat) || isNaN(lon)) {
                console.log('\n❌ Invalid coordinates! Please enter numbers only.');
                continue;
            }

            await testLocation(lat, lon);

            const again = await askQuestion('\nTest another location? (y/n): ');
            if (again.toLowerCase() !== 'y') {
                console.log('\n👋 Goodbye!\n');
                rl.close();
                break;
            }
        } else {
            console.log('\n❌ Invalid choice! Please enter 1-8.');
        }
    }
}

// Run the interactive tester
main();
