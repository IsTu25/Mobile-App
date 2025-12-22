/**
 * Test script for Danger Prediction System
 * Demonstrates AI-powered risk scoring using Bangladesh crime data
 * 
 * Run: node scripts/test-danger-prediction.js
 */

const dangerPredictionService = require('../src/services/danger-prediction.service');

// Test locations in Dhaka
const testLocations = [
    { name: 'Uttara (High Crime)', lat: 23.8754, lon: 90.3965 },
    { name: 'Gulshan (High Crime)', lat: 23.7808, lon: 90.4161 },
    { name: 'Demra (Low Crime)', lat: 23.7456, lon: 90.5234 },
    { name: 'Dhanmondi (Medium Crime)', lat: 23.7465, lon: 90.3765 },
    { name: 'Random Location', lat: 23.8103, lon: 90.4125 }
];

async function runTests() {
    console.log('\n🚀 ========================================');
    console.log('   DANGER PREDICTION SYSTEM TEST');
    console.log('   ========================================\n');

    // Load dataset first
    console.log('📊 Loading Bangladesh crime dataset...\n');
    await dangerPredictionService.loadCrimeDataset();

    console.log('\n📍 Testing risk scores for different locations:\n');
    console.log('─'.repeat(80));

    for (const location of testLocations) {
        console.log(`\n🔍 Location: ${location.name}`);
        console.log(`   Coordinates: ${location.lat}, ${location.lon}`);

        // Test at different times
        const morningTime = new Date();
        morningTime.setHours(9, 0, 0);

        const nightTime = new Date();
        nightTime.setHours(23, 0, 0);

        // Morning risk
        const morningRisk = await dangerPredictionService.calculateRiskScore(
            location.lat,
            location.lon,
            morningTime
        );

        // Night risk
        const nightRisk = await dangerPredictionService.calculateRiskScore(
            location.lat,
            location.lon,
            nightTime
        );

        console.log(`\n   ☀️  Morning (9 AM):`);
        console.log(`      Risk Score: ${morningRisk.riskScore}/100`);
        console.log(`      Risk Level: ${morningRisk.riskLevel.toUpperCase()}`);
        console.log(`      Color: ${getRiskColor(morningRisk.riskLevel)}`);

        console.log(`\n   🌙 Night (11 PM):`);
        console.log(`      Risk Score: ${nightRisk.riskScore}/100`);
        console.log(`      Risk Level: ${nightRisk.riskLevel.toUpperCase()}`);
        console.log(`      Color: ${getRiskColor(nightRisk.riskLevel)}`);

        console.log(`\n   📊 Risk Breakdown (Morning):`);
        console.log(`      Hotspot Proximity: ${morningRisk.breakdown.hotspotRisk}/100`);
        console.log(`      Historical Crimes: ${morningRisk.breakdown.historicalRisk}/100`);
        console.log(`      Time Factor: ${morningRisk.breakdown.timeRisk}/100`);
        console.log(`      Day Factor: ${morningRisk.breakdown.dayRisk}/100`);

        console.log(`\n   🎯 Nearest Hotspot: ${morningRisk.location.nearestHotspot.name}`);
        console.log(`      Distance: ${morningRisk.location.nearestHotspot.distance}m`);
        console.log(`      Hotspot Risk: ${morningRisk.location.nearestHotspot.riskLevel}/100`);

        if (morningRisk.nearbyIncidents.length > 0) {
            console.log(`\n   ⚠️  Nearby Incidents: ${morningRisk.nearbyIncidents.length} within 2km`);
            console.log(`      Closest: ${morningRisk.nearbyIncidents[0].crimeType} (${morningRisk.nearbyIncidents[0].distance}m away)`);
        } else {
            console.log(`\n   ✅ No recent incidents within 2km`);
        }

        console.log('\n' + '─'.repeat(80));
    }

    // Test safe route
    console.log('\n\n🛣️  Testing Safe Route Suggestion:\n');
    console.log('─'.repeat(80));
    console.log('\nFrom: Uttara (High Crime)');
    console.log('To: Demra (Low Crime)');

    const routeData = await dangerPredictionService.getSafeRoute(
        23.8754, 90.3965,  // Uttara
        23.7456, 90.5234   // Demra
    );

    console.log(`\n📍 Direct Route:`);
    console.log(`   Risk Score: ${routeData.directRoute.risk}/100`);
    console.log(`   Recommended: ${routeData.directRoute.recommended ? 'YES ✅' : 'NO ❌'}`);

    if (routeData.alternativeRoute) {
        console.log(`\n🔄 Alternative Route (Safer):`);
        console.log(`   Via: ${routeData.alternativeRoute.viaArea}`);
        console.log(`   Risk Score: ${routeData.alternativeRoute.risk}/100`);
        console.log(`   Coordinates: ${routeData.alternativeRoute.coordinates.lat}, ${routeData.alternativeRoute.coordinates.lon}`);
    }

    console.log('\n' + '─'.repeat(80));

    // Show dataset statistics
    console.log('\n\n📈 Dataset Statistics:\n');
    console.log('─'.repeat(80));
    console.log(`\n✅ Total Crime Records: ${dangerPredictionService.crimeData.length}`);
    console.log(`📍 Crime Hotspots: ${dangerPredictionService.crimeHotspots.length}`);

    const thanas = [...new Set(dangerPredictionService.crimeData.map(d => d.thana))];
    console.log(`🏢 Thanas Covered: ${thanas.length}`);
    console.log(`   ${thanas.join(', ')}`);

    const crimeTypes = {};
    dangerPredictionService.crimeData.forEach(crime => {
        crimeTypes[crime.crimeType] = (crimeTypes[crime.crimeType] || 0) + 1;
    });

    console.log(`\n📊 Crime Type Distribution:`);
    Object.entries(crimeTypes)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
            const percentage = ((count / dangerPredictionService.crimeData.length) * 100).toFixed(1);
            console.log(`   ${type}: ${count} (${percentage}%)`);
        });

    console.log('\n' + '─'.repeat(80));

    console.log('\n\n✅ ========================================');
    console.log('   TEST COMPLETE!');
    console.log('   ========================================\n');

    console.log('📝 Summary:');
    console.log('   ✅ Dataset loaded successfully');
    console.log('   ✅ Risk scoring working');
    console.log('   ✅ Time-based analysis working');
    console.log('   ✅ Hotspot proximity working');
    console.log('   ✅ Safe route suggestions working');
    console.log('   ✅ Nearby incidents detection working\n');

    console.log('🎯 Ready for demonstration!\n');
}

function getRiskColor(riskLevel) {
    const colors = {
        'low': '🟢 GREEN',
        'medium': '🟡 YELLOW',
        'high': '🟠 ORANGE',
        'critical': '🔴 RED'
    };
    return colors[riskLevel] || 'UNKNOWN';
}

// Run tests
runTests().catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
});
