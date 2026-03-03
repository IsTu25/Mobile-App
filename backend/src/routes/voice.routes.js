/**
 * Voice Routes
 * Endpoints for voice analysis and hotword detection
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();

const voiceController = require('../controllers/voice.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Configure multer for audio uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'audio/wav', 'audio/wave', 'audio/x-wav',
            'audio/mpeg', 'audio/mp3',
            'audio/mp4', 'audio/x-m4a',
            'audio/aac', 'audio/x-aac',
            'audio/ogg', 'audio/webm'
        ];

        if (allowedMimes.includes(file.mimetype.toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Invalid audio format. Supported: WAV, MP3, M4A, AAC, OGG, WEBM'));
        }
    }
});

// Use authenticateToken instead of authenticate based on existing project structure
// POST /api/voice/analyze
router.post(
    '/analyze',
    authenticateToken,
    upload.single('audio'),
    async (req, res, next) => {
        try {
            console.log(`🎤 Voice analyze request - User: ${req.userId}`);

            if (req.body.location && typeof req.body.location === 'string') {
                try {
                    req.body.location = JSON.parse(req.body.location);
                } catch (e) {
                    console.warn('⚠️ Could not parse location JSON');
                }
            }

            await voiceController.analyzeVoice(req, res, next);
        } catch (error) {
            console.error(`❌ Voice analyze error: ${error.message}`);
            next(error);
        }
    }
);

// GET /api/voice/hotwords
router.get('/hotwords', authenticateToken, async (req, res, next) => {
    try {
        console.log(`📋 Get hotwords request - User: ${req.userId}`);
        await voiceController.getHotwords(req, res, next);
    } catch (error) {
        console.error(`❌ Get hotwords error: ${error.message}`);
        next(error);
    }
});

// PUT /api/voice/hotwords
router.put('/hotwords', authenticateToken, async (req, res, next) => {
    try {
        console.log(`✏️ Update hotwords request - User: ${req.userId}`);
        await voiceController.updateHotwords(req, res, next);
    } catch (error) {
        console.error(`❌ Update hotwords error: ${error.message}`);
        next(error);
    }
});

// POST /api/voice/hotwords/reset
router.post('/hotwords/reset', authenticateToken, async (req, res, next) => {
    try {
        console.log(`🔄 Reset hotwords request - User: ${req.userId}`);
        await voiceController.resetHotwords(req, res, next);
    } catch (error) {
        console.error(`❌ Reset hotwords error: ${error.message}`);
        next(error);
    }
});

// POST /api/voice/test
router.post('/test', authenticateToken, async (req, res, next) => {
    try {
        console.log(`🧪 Voice test request - User: ${req.userId}`);
        await voiceController.testAnalysis(req, res, next);
    } catch (error) {
        console.error(`❌ Voice test error: ${error.message}`);
        next(error);
    }
});

module.exports = router;
