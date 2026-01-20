const {
    findNearestPoliceStation,
    findNearestPoliceStations,
} = require('./src/utils/policeStationFinder');

async function testPoliceFinder() {
    console.log('\n🚨 Testing Police Station Finder\n');
    console.log('='.repeat(60));

    // Test locations
    const testLocations = [
        { name: 'BUET Campus', lat: 23.7263, lon: 90.3925 },
        { name: 'Gulshan 2', lat: 23.7808, lon: 90.4161 },
        { name: 'Chittagong City', lat: 22.3569, lon: 91.7832 },
        { name: 'Sylhet City', lat: 24.8949, lon: 91.8687 },
    ];

    for (const location of testLocations) {
        console.log(`\n📍 Location: ${location.name}`);
        console.log(`   Coordinates: ${location.lat}, ${location.lon}`);

        try {
            // Find nearest station
            const nearest = await findNearestPoliceStation(location.lat, location.lon);

            console.log(`\n   ✅ Nearest Police Station:`);
            console.log(`      Name: ${nearest.name}`);
            console.log(`      District: ${nearest.district}`);
            console.log(`      Division: ${nearest.division}`);
            console.log(`      Distance: ${nearest.distanceKm} km`);
            console.log(`      Email: ${nearest.email}`);
            console.log(`      Phone: ${nearest.phone}`);

            // Find 3 nearest stations
            const nearestThree = await findNearestPoliceStations(
                location.lat,
                location.lon,
                3
            );

            console.log(`\n   📋 Top 3 Nearest Stations:`);
            nearestThree.forEach((station, index) => {
                console.log(`      ${index + 1}. ${station.name} (${station.distanceKm} km)`);
            });
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }

        console.log('\n' + '-'.repeat(60));
    }
}

testPoliceFinder().catch(console.error);
