const mongoose = require('mongoose');
const PoliceStation = require('./src/models/PoliceStation');
const { generateId } = require('./src/utils/id-generator');

require('dotenv').config();

// Sample police station data (Dhaka, Bangladesh)
const policeStations = [
  {
    stationId: generateId('PS'),
    name: 'Dhanmondi Police Station',
    location: {
      type: 'Point',
      coordinates: [90.3688, 23.7462] // [longitude, latitude]
    },
    address: 'Road 2, Dhanmondi, Dhaka-1205',
    phone: '+880-2-9665296',
    emergencyHotline: '999',
    email: 'dhanmondi.ps@police.gov.bd',
    acceptsDigitalAlerts: true,
    isActive: true
  },
  {
    stationId: generateId('PS'),
    name: 'Gulshan Police Station',
    location: {
      type: 'Point',
      coordinates: [90.4125, 23.7809]
    },
    address: 'Gulshan 1, Dhaka-1212',
    phone: '+880-2-9884000',
    emergencyHotline: '999',
    email: 'gulshan.ps@police.gov.bd',
    acceptsDigitalAlerts: true,
    isActive: true
  },
  {
    stationId: generateId('PS'),
    name: 'Mirpur Model Police Station',
    location: {
      type: 'Point',
      coordinates: [90.3563, 23.8223]
    },
    address: 'Mirpur-10, Dhaka-1216',
    phone: '+880-2-9006601',
    emergencyHotline: '999',
    email: 'mirpur.ps@police.gov.bd',
    acceptsDigitalAlerts: true,
    isActive: true
  },
  {
    stationId: generateId('PS'),
    name: 'Uttara West Police Station',
    location: {
      type: 'Point',
      coordinates: [90.3792, 23.8755]
    },
    address: 'Sector 7, Uttara, Dhaka-1230',
    phone: '+880-2-7912366',
    emergencyHotline: '999',
    email: 'uttara.ps@police.gov.bd',
    acceptsDigitalAlerts: true,
    isActive: true
  },
  {
    stationId: generateId('PS'),
    name: 'Banani Police Station',
    location: {
      type: 'Point',
      coordinates: [90.4044, 23.7932]
    },
    address: 'Banani, Dhaka-1213',
    phone: '+880-2-9883190',
    emergencyHotline: '999',
    email: 'banani.ps@police.gov.bd',
    acceptsDigitalAlerts: true,
  },
  {
    stationId: generateId('PS'),
    name: 'Test Police HQ (Demo)',
    location: {
      type: 'Point',
      coordinates: [90.4125, 23.8103] // General Dhaka area
    },
    address: 'Police HQ, Dhaka',
    phone: '01837121760', // Matches the Hardcoded SOS Number
    emergencyHotline: '999',
    email: 'isfakiqbal@iut-dhaka.edu', // Redirect to user for testing
    acceptsDigitalAlerts: true,
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Clear existing police stations
    await PoliceStation.deleteMany({});
    console.log('🗑️  Cleared existing police stations');

    // Insert sample police stations
    const result = await PoliceStation.insertMany(policeStations);
    console.log(`✅ Inserted ${result.length} police stations`);

    console.log('\n📍 Police Stations:');
    result.forEach(station => {
      console.log(`   - ${station.name} (${station.stationId})`);
    });

    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
