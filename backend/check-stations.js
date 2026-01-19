const mongoose = require('mongoose');
const PoliceStation = require('./src/models/PoliceStation');
const config = require('./src/config/env');

async function checkStations() {
    try {
        await mongoose.connect(config.MONGODB_URI);
        console.log('✅ Connected to DB');

        const count = await PoliceStation.countDocuments();
        console.log(`👮 Total Police Stations: ${count}`);

        const target = await PoliceStation.findOne({ phone: '01837121760' });
        if (target) {
            console.log('✅ Default Target Station Found:', target.name, target.email);
        } else {
            console.log('❌ Default Target Station (01837121760) NOT FOUND');
        }

        const anyStation = await PoliceStation.findOne();
        if (anyStation) {
            console.log('ℹ️ Sample Station:', anyStation.name, anyStation.phone);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkStations();
