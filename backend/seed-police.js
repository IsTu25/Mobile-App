const mongoose = require('mongoose');
const PoliceStation = require('./src/models/PoliceStation');
const { generateId } = require('./src/utils/id-generator');
require('dotenv').config();

const seedPoliceStations = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB for seeding');

        const testStation = {
            stationId: 'PS-TEST-01',
            name: 'Test Police Station',
            location: {
                type: 'Point',
                coordinates: [90.4125, 23.8103] // Dhaka coordinates, covers default '0,0' if we search widely or update user location
            },
            address: 'Test Location, Dhaka',
            phone: '01837121760',
            email: 'isfakiqbal@iut-dhaka.edu',
            isActive: true,
            acceptsDigitalAlerts: true
        };

        const existing = await PoliceStation.findOne({ phone: testStation.phone });
        if (existing) {
            existing.email = testStation.email;
            existing.location = testStation.location;
            await existing.save();
            console.log('✅ Updated existing Test Police Station');
        } else {
            await PoliceStation.create(testStation);
            console.log('✅ Created Test Police Station');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedPoliceStations();
