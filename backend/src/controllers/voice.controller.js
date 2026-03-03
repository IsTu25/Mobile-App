/**
 * Voice Controller
 * Handles voice analysis endpoints
 */

const voiceAnalysisService = require('../services/voice-analysis.service');
const emergencyService = require('../services/emergency.service');
const User = require('../models/User');

class VoiceController {
    /**
     * Analyze voice audio for hotwords
     * POST /api/voice/analyze
     */
    async analyzeVoice(req, res, next) {
        try {
            const userId = req.userId;

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Audio file is required'
                });
            }

            console.log(`🎤 Voice analysis request from user: ${userId}`);

            const maxSizeMB = 10;
            if (!voiceAnalysisService.validateAudioBuffer(req.file.buffer, maxSizeMB)) {
                return res.status(400).json({
                    success: false,
                    message: `Audio file must be less than ${maxSizeMB}MB`
                });
            }

            // Get user's hotwords
            let userHotWords = [];
            try {
                const user = await User.findOne({ userId }); // Optimized lookup
                if (user && user.hotWords && user.hotWords.length > 0) {
                    userHotWords = user.hotWords;
                }
            } catch (error) {
                console.warn(`⚠️ Could not fetch user hotwords: ${error.message}`);
                userHotWords = voiceAnalysisService.getDefaultHotwords();
            }

            const audioFormat = this.getAudioFormat(req.file.mimetype);

            // Analyze audio
            const analysisResult = await voiceAnalysisService.analyzeAudioForHotwords(
                req.file.buffer,
                audioFormat,
                userHotWords
            );

            console.log(`✅ Analysis result: ${JSON.stringify(analysisResult)}`);

            // If hotword detected, trigger SOS
            let sosAlert = null;
            if (analysisResult.triggered) {
                console.log(`🚨 HOTWORD DETECTED: "${analysisResult.matchedWord}". Triggering SOS...`);

                try {
                    // Parse location if it's a string (from multipart)
                    let locationRaw = req.body.location;
                    if (typeof locationRaw === 'string') {
                        try { locationRaw = JSON.parse(locationRaw); } catch (e) { }
                    }

                    if (!locationRaw || !locationRaw.coordinates) {
                        console.warn('⚠️ No location provided for SOS trigger');
                        return res.status(400).json({
                            success: false,
                            message: 'Location is required for voice-activated SOS',
                            analysis: analysisResult
                        });
                    }

                    // Trigger SOS
                    sosAlert = await emergencyService.createSOSAlert(
                        userId,
                        locationRaw,
                        'voice',
                        analysisResult.matchedWord,
                        analysisResult.transcription,
                        analysisResult.confidence
                    );

                    console.log(`✅ SOS alert created: ${sosAlert.alertId}`);

                } catch (error) {
                    console.error(`❌ Failed to create SOS alert: ${error.message}`);
                    return res.status(201).json({
                        success: true,
                        triggered: true,
                        matched_word: analysisResult.matchedWord,
                        transcript: analysisResult.transcription,
                        warning: 'SOS alert could not be triggered. Please try again.',
                        analysis: analysisResult
                    });
                }
            }

            const response = {
                success: true,
                triggered: analysisResult.triggered,
                transcript: analysisResult.transcription,
                matched_word: analysisResult.matchedWord || null,
                confidence: analysisResult.confidence || 0,
                sos_alert_id: sosAlert ? sosAlert.alertId : null
            };

            if (analysisResult.error) {
                response.error = analysisResult.error;
            }

            res.status(201).json(response);

        } catch (error) {
            console.error(`❌ Voice analysis error: ${error.message}`);
            next(error);
        }
    }

    /**
     * Get user's hotwords
     * GET /api/voice/hotwords
     */
    async getHotwords(req, res, next) {
        try {
            const userId = req.userId;

            const user = await User.findOne({ userId });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const hotwords = user.hotWords || voiceAnalysisService.getDefaultHotwords();

            res.status(200).json({
                success: true,
                hotwords,
                isCustom: user.hotWords && user.hotWords.length > 0
            });

        } catch (error) {
            console.error(`❌ Error fetching hotwords: ${error.message}`);
            next(error);
        }
    }

    /**
     * Update user's hotwords
     * PUT /api/voice/hotwords
     */
    async updateHotwords(req, res, next) {
        try {
            const userId = req.userId;
            const { hotwords } = req.body;

            if (!Array.isArray(hotwords) || hotwords.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Hotwords must be a non-empty array of strings'
                });
            }

            for (const word of hotwords) {
                if (typeof word !== 'string' || word.trim().length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Each hotword must be a non-empty string'
                    });
                }
            }

            const cleanedHotwords = hotwords.map(w => w.trim().toLowerCase());

            const user = await User.findOneAndUpdate(
                { userId },
                { hotWords: cleanedHotwords },
                { new: true, runValidators: true }
            );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            console.log(`✅ Hotwords updated for user ${userId}`);

            res.status(200).json({
                success: true,
                message: 'Hotwords updated successfully',
                hotwords: user.hotWords
            });

        } catch (error) {
            console.error(`❌ Error updating hotwords: ${error.message}`);
            next(error);
        }
    }

    /**
     * Reset hotwords to defaults
     * POST /api/voice/hotwords/reset
     */
    async resetHotwords(req, res, next) {
        try {
            const userId = req.userId;
            const defaultHotwords = voiceAnalysisService.getDefaultHotwords();

            const user = await User.findOneAndUpdate(
                { userId },
                { hotWords: defaultHotwords },
                { new: true }
            );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            console.log(`✅ Hotwords reset for user ${userId}`);

            res.status(200).json({
                success: true,
                message: 'Hotwords reset to defaults',
                hotwords: user.hotWords
            });

        } catch (error) {
            console.error(`❌ Error resetting hotwords: ${error.message}`);
            next(error);
        }
    }

    /**
     * Test voice analysis
     * POST /api/voice/test
     */
    async testAnalysis(req, res, next) {
        try {
            const { transcription, hotwords } = req.body;

            if (!transcription || !Array.isArray(hotwords)) {
                return res.status(400).json({
                    success: false,
                    message: 'Transcription and hotwords array are required'
                });
            }

            const result = voiceAnalysisService.detectHotwords(
                transcription,
                hotwords
            );

            res.status(200).json({
                success: true,
                transcription,
                hotwords,
                ...result
            });

        } catch (error) {
            console.error(`❌ Error in test analysis: ${error.message}`);
            next(error);
        }
    }

    getAudioFormat(mimetype) {
        if (!mimetype) return 'wav';

        const mimeToFormat = {
            'audio/wav': 'wav',
            'audio/wave': 'wav',
            'audio/x-wav': 'wav',
            'audio/mpeg': 'mp3',
            'audio/mp3': 'mp3',
            'audio/mp4': 'm4a',
            'audio/x-m4a': 'm4a',
            'audio/aac': 'aac',
            'audio/x-aac': 'aac',
            'audio/ogg': 'ogg',
            'audio/webm': 'webm'
        };

        return mimeToFormat[mimetype.toLowerCase()] || 'wav';
    }
}

module.exports = new VoiceController();
