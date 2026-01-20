const recognitionService = require('./src/services/recognition.service');
const path = require('path');

async function test() {
    try {
        console.log('🧪 Testing Recognition Service with Video...');
        const videoPath = path.join(__dirname, 'test.mp4');
        console.log('Video Path:', videoPath);

        const result = await recognitionService.processVideo(videoPath);
        console.log('✅ Result:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

test();
