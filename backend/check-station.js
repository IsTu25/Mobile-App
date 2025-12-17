const mongoose = require('mongoose');
const PoliceStation = require('./src/models/PoliceStation');
require('dotenv').config();

const checkStation = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const station = await PoliceStation.findOne({ phone: '01837121760' });
        console.log('Police Station Email:', station ? station.email : 'Not Found');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkStation();
