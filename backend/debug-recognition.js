const recognitionService = require('./src/services/recognition.service');
const path = require('path');

async function test() {
    try {
        console.log('Testing Recognition Service...');
        console.log('1. Loading Models...');
        await recognitionService.loadModels();
        console.log('✅ Models Loaded');

        console.log('2. Loading Dataset...');
        await recognitionService.loadDataset();
        console.log('✅ Dataset Loaded');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

test();
