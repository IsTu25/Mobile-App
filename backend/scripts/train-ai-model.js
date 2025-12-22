/**
 * AI Model Training Script
 * Trains the danger prediction model on Bangladesh crime dataset
 * Run: node scripts/train-ai-model.js
 */

const aiModel = require('../src/services/ai-danger-model.service');

async function trainModel() {
    console.log('\n🚀 ========================================');
    console.log('   AI MODEL TRAINING - BANGLADESH CRIME DATA');
    console.log('   ========================================\n');

    try {
        // Train the model
        const stats = await aiModel.train();

        console.log('\n📊 ========================================');
        console.log('   TRAINING RESULTS');
        console.log('   ========================================\n');

        console.log(`✅ Model Status: TRAINED`);
        console.log(`📁 Dataset: bangladesh_crime_data_full.csv`);
        console.log(`📊 Total Records: ${stats.totalRecords}`);
        console.log(`🏢 Police Units Analyzed: ${stats.policeUnits}`);
        console.log(`📅 Time Period: ${stats.timePeriod}`);
        console.log(`🔢 Crime Categories: ${stats.crimeCategories}`);
        console.log(`⚠️  Highest Risk Unit: ${stats.highestRiskUnit}`);
        console.log(`✅ Lowest Risk Unit: ${stats.lowestRiskUnit}`);

        // Get model info
        const modelInfo = aiModel.getModelInfo();

        console.log('\n📈 ========================================');
        console.log('   TOP 5 HIGH-RISK POLICE UNITS');
        console.log('   ========================================\n');

        modelInfo.topRiskUnits.forEach((unit, index) => {
            const emoji = index === 0 ? '🔴' : index === 1 ? '🟠' : index === 2 ? '🟡' : '🟢';
            console.log(`   ${emoji} ${index + 1}. ${unit.unit.padEnd(20)} → Risk: ${unit.risk}/100`);
        });

        // Test predictions
        console.log('\n🧪 ========================================');
        console.log('   TESTING PREDICTIONS');
        console.log('   ========================================\n');

        const testLocations = [
            { name: 'Dhaka (DMP) - Night', lat: 23.8103, lon: 90.4125, hour: 23 },
            { name: 'Dhaka (DMP) - Morning', lat: 23.8103, lon: 90.4125, hour: 8 },
            { name: 'Chittagong - Evening', lat: 22.3569, lon: 91.7832, hour: 19 },
            { name: 'Rangpur - Morning', lat: 25.7439, lon: 89.2752, hour: 9 }
        ];

        for (const loc of testLocations) {
            const testTime = new Date();
            testTime.setHours(loc.hour);

            const prediction = await aiModel.predict(loc.lat, loc.lon, testTime);

            console.log(`📍 ${loc.name}`);
            console.log(`   Coordinates: ${loc.lat}, ${loc.lon}`);
            console.log(`   Police Unit: ${prediction.policeUnit}`);
            console.log(`   Risk Score: ${prediction.riskScore}/100`);
            console.log(`   Risk Level: ${prediction.riskLevel.toUpperCase()}`);
            console.log(`   Color: ${prediction.color}`);
            console.log(`   Message: ${prediction.message}`);
            console.log(`   Base Risk: ${prediction.breakdown.baseRisk}`);
            console.log(`   Time Multiplier: ${prediction.breakdown.timeMultiplier}x`);
            console.log('');
        }

        console.log('✅ ========================================');
        console.log('   TRAINING COMPLETE!');
        console.log('   ========================================\n');

        console.log('🎯 Model is ready for use!');
        console.log('📱 Mobile app can now get real-time danger predictions\n');

    } catch (error) {
        console.error('\n❌ Training failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run training
trainModel();
