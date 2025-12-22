/**
 * Common Bangladesh Locations with Coordinates
 * Use this as a reference or copy coordinates for testing
 */

const bangladeshLocations = {
    // DHAKA - High Risk Areas
    'Uttara': { lat: 23.8754, lon: 90.3965, risk: 'HIGH' },
    'Gulshan': { lat: 23.7808, lon: 90.4161, risk: 'HIGH' },
    'Banani': { lat: 23.7937, lon: 90.4066, risk: 'HIGH' },
    'Paltan': { lat: 23.7338, lon: 90.4125, risk: 'HIGH' },
    'Shahbag': { lat: 23.7389, lon: 90.3948, risk: 'HIGH' },

    // DHAKA - Medium Risk Areas
    'Dhanmondi': { lat: 23.7465, lon: 90.3765, risk: 'MEDIUM' },
    'Mirpur': { lat: 23.8223, lon: 90.3654, risk: 'MEDIUM' },
    'Mohammadpur': { lat: 23.7654, lon: 90.3547, risk: 'MEDIUM' },
    'Badda': { lat: 23.7806, lon: 90.4250, risk: 'MEDIUM' },
    'Rampura': { lat: 23.7617, lon: 90.4253, risk: 'MEDIUM' },

    // DHAKA - Low Risk Areas
    'Demra': { lat: 23.7456, lon: 90.5234, risk: 'LOW' },
    'Lalbag': { lat: 23.7197, lon: 90.3854, risk: 'LOW' },
    'Sutrapur': { lat: 23.7123, lon: 90.4098, risk: 'LOW' },
    'Hazaribag': { lat: 23.7298, lon: 90.3621, risk: 'LOW' },

    // DHAKA - Universities
    'Dhaka University': { lat: 23.7289, lon: 90.3933, risk: 'MEDIUM' },
    'BUET': { lat: 23.7263, lon: 90.3925, risk: 'MEDIUM' },
    'IUT Gazipur': { lat: 23.9881, lon: 90.4198, risk: 'LOW' },
    'NSU': { lat: 23.8103, lon: 90.4125, risk: 'MEDIUM' },
    'BRAC University': { lat: 23.7808, lon: 90.4067, risk: 'MEDIUM' },

    // DHAKA - Shopping/Commercial
    'Bashundhara City': { lat: 23.7501, lon: 90.3872, risk: 'MEDIUM' },
    'Jamuna Future Park': { lat: 23.8103, lon: 90.4252, risk: 'MEDIUM' },
    'New Market': { lat: 23.7343, lon: 90.3876, risk: 'HIGH' },

    // OTHER MAJOR CITIES
    'Chittagong City': { lat: 22.3569, lon: 91.7832, risk: 'MEDIUM' },
    'Sylhet City': { lat: 24.8949, lon: 91.8687, risk: 'LOW' },
    'Khulna City': { lat: 22.8456, lon: 89.5403, risk: 'MEDIUM' },
    'Rajshahi City': { lat: 24.3745, lon: 88.6042, risk: 'LOW' },
    'Rangpur City': { lat: 25.7439, lon: 89.2752, risk: 'LOW' },
    'Comilla City': { lat: 23.4607, lon: 91.1809, risk: 'LOW' },

    // TOURIST SPOTS
    'Cox\'s Bazar Beach': { lat: 21.4272, lon: 92.0058, risk: 'LOW' },
    'Sundarbans': { lat: 21.9497, lon: 89.1833, risk: 'LOW' },
    'Srimangal': { lat: 24.3065, lon: 91.7296, risk: 'LOW' },
};

// Function to search for a location
function findLocation(searchTerm) {
    const term = searchTerm.toLowerCase();
    const results = [];

    for (const [name, data] of Object.entries(bangladeshLocations)) {
        if (name.toLowerCase().includes(term)) {
            results.push({ name, ...data });
        }
    }

    return results;
}

// Function to display all locations
function displayAllLocations() {
    console.log('\n📍 BANGLADESH LOCATIONS WITH COORDINATES\n');
    console.log('='.repeat(80));

    const categories = {
        'DHAKA - High Risk': [],
        'DHAKA - Medium Risk': [],
        'DHAKA - Low Risk': [],
        'DHAKA - Universities': [],
        'DHAKA - Shopping': [],
        'Other Cities': [],
        'Tourist Spots': []
    };

    Object.entries(bangladeshLocations).forEach(([name, data]) => {
        const entry = `${name.padEnd(25)} | Lat: ${data.lat.toFixed(4)} | Lon: ${data.lon.toFixed(4)} | Risk: ${data.risk}`;

        if (name.includes('University') || name.includes('BUET') || name.includes('IUT') || name.includes('NSU') || name.includes('BRAC')) {
            categories['DHAKA - Universities'].push(entry);
        } else if (name.includes('City') || name.includes('Bazar') || name.includes('Beach')) {
            if (data.risk === 'LOW') {
                categories['Tourist Spots'].push(entry);
            } else {
                categories['Other Cities'].push(entry);
            }
        } else if (name.includes('Bashundhara') || name.includes('Jamuna') || name.includes('Market')) {
            categories['DHAKA - Shopping'].push(entry);
        } else if (data.risk === 'HIGH') {
            categories['DHAKA - High Risk'].push(entry);
        } else if (data.risk === 'MEDIUM') {
            categories['DHAKA - Medium Risk'].push(entry);
        } else {
            categories['DHAKA - Low Risk'].push(entry);
        }
    });

    Object.entries(categories).forEach(([category, locations]) => {
        if (locations.length > 0) {
            console.log(`\n${category}:`);
            console.log('-'.repeat(80));
            locations.forEach(loc => console.log(loc));
        }
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n💡 Usage:');
    console.log('   Copy the coordinates and use them in test scripts:');
    console.log('   node test-interactive.js <lat> <lon>');
    console.log('\n   Example:');
    console.log('   node test-interactive.js 23.8754 90.3965  (Uttara)');
    console.log('\n' + '='.repeat(80) + '\n');
}

// If run directly, display all locations
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        displayAllLocations();
    } else {
        const searchTerm = args.join(' ');
        const results = findLocation(searchTerm);

        if (results.length === 0) {
            console.log(`\n❌ No locations found matching "${searchTerm}"\n`);
            console.log('Try searching for: Dhaka, Uttara, Gulshan, University, etc.\n');
        } else {
            console.log(`\n📍 Found ${results.length} location(s) matching "${searchTerm}":\n`);
            results.forEach(loc => {
                console.log(`${loc.name}:`);
                console.log(`  Latitude:  ${loc.lat}`);
                console.log(`  Longitude: ${loc.lon}`);
                console.log(`  Risk:      ${loc.risk}`);
                console.log(`  Test:      node test-interactive.js ${loc.lat} ${loc.lon}\n`);
            });
        }
    }
}

module.exports = { bangladeshLocations, findLocation };
