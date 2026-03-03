/**
 * Voice Analysis Service
 * Analyzes audio for hotword detection and triggers SOS alerts
 */

const speech = require('@google-cloud/speech').v1;
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

class VoiceAnalysisService {
    constructor() {
        // Check if credentials file exists, otherwise log warning
        const keyPath = process.env.GOOGLE_CLOUD_KEY_FILE || './google-credentials.json';

        try {
            this.client = new speech.SpeechClient({
                keyFilename: keyPath
            });
        } catch (err) {
            console.warn('⚠️ Google Cloud Speech Client could not be initialized. Verify credentials.');
        }

        this.defaultHotWords = [
            'help',
            'bachao',
            'save me',
            'police',
            'emergency'
        ];
    }

    /**
     * Analyze audio for hotwords
     */
    async analyzeAudioForHotwords(audioBuffer, audioFormat, userHotWords = []) {
        try {
            console.log(`🎤 Starting voice analysis. Audio format: ${audioFormat}`);

            const hotWordsToCheck = userHotWords.length > 0 ? userHotWords : this.defaultHotWords;
            console.log(`📋 Hotwords to check: ${hotWordsToCheck.join(', ')}`);

            // Convert audio if needed
            let wavBuffer = audioBuffer;
            if (audioFormat && audioFormat.toLowerCase() !== 'wav') {
                console.log(`🔄 Converting ${audioFormat} to WAV format...`);
                wavBuffer = await this.convertAudioToWav(audioBuffer, audioFormat);
            }

            // Transcribe audio
            const transcription = await this.transcribeAudio(wavBuffer);
            console.log(`✅ Transcribed text: "${transcription}"`);

            if (!transcription) {
                return {
                    triggered: false,
                    transcription: '',
                    matchedWord: null,
                    error: 'Could not transcribe audio'
                };
            }

            // Detect hotwords
            const result = this.detectHotwords(transcription, hotWordsToCheck);
            result.transcription = transcription;

            return result;

        } catch (error) {
            console.error(`❌ Voice analysis error: ${error.message}`);
            return {
                triggered: false,
                transcription: '',
                matchedWord: null,
                error: error.message
            };
        }
    }

    /**
     * Transcribe audio using Google Cloud Speech-to-Text API
     */
    async transcribeAudio(wavBuffer) {
        try {
            if (!this.client) {
                throw new Error('Google Cloud Speech Client not initialized');
            }

            const audioContent = wavBuffer.toString('base64');

            const request = {
                audio: {
                    content: audioContent
                },
                config: {
                    encoding: 'LINEAR16',
                    sampleRateHertz: 16000,
                    languageCode: 'en-US',
                    alternativeLanguageCodes: ['bn-BD'],
                    maxAlternatives: 1,
                    enableAutomaticPunctuation: true
                }
            };

            console.log('📤 Sending to Google Cloud Speech-to-Text API...');

            const [response] = await this.client.recognize(request);

            if (!response.results || response.results.length === 0) {
                console.warn('⚠️ No speech detected in audio');
                return '';
            }

            const transcription = response.results
                .map(result =>
                    result.alternatives[0] ? result.alternatives[0].transcript : ''
                )
                .join('\n')
                .trim();

            console.log(`📝 Transcription complete: "${transcription}"`);
            return transcription;

        } catch (error) {
            console.error(`❌ Transcription error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Detect hotwords in transcribed text
     */
    detectHotwords(transcription, hotWords) {
        if (!transcription || transcription.trim().length === 0) {
            return {
                triggered: false,
                matchedWord: null
            };
        }

        const transcriptionLower = transcription.toLowerCase();

        for (const hotword of hotWords) {
            const hotwordLower = hotword.toLowerCase();

            // Exact substring match
            if (transcriptionLower.includes(hotwordLower)) {
                console.log(`🎯 Hotword detected: "${hotword}"`);
                return {
                    triggered: true,
                    matchedWord: hotword,
                    confidence: 0.95
                };
            }

            // Fuzzy match
            if (this.fuzzyMatch(transcriptionLower, hotwordLower)) {
                console.log(`🎯 Hotword detected (fuzzy): "${hotword}"`);
                return {
                    triggered: true,
                    matchedWord: hotword,
                    confidence: 0.85
                };
            }
        }

        console.log('❌ No hotwords detected');
        return {
            triggered: false,
            matchedWord: null,
            confidence: 0
        };
    }

    /**
     * Fuzzy match - finds word with close similarity
     */
    fuzzyMatch(text, word) {
        const words = text.split(/[\s\-\,\.\!\?]+/);

        return words.some(w => {
            const distance = this.levenshteinDistance(w, word);
            const maxDistance = Math.ceil(word.length * 0.3);
            return distance <= maxDistance;
        });
    }

    /**
     * Levenshtein distance algorithm
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Convert audio to WAV format
     */
    async convertAudioToWav(audioBuffer, sourceFormat) {
        return new Promise((resolve, reject) => {
            try {
                const tempDir = path.join(__dirname, '../../temp'); // Adjusted path
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                const inputPath = path.join(tempDir, `input_${Date.now()}.${sourceFormat}`);
                const outputPath = path.join(tempDir, `output_${Date.now()}.wav`);

                fs.writeFileSync(inputPath, audioBuffer);

                ffmpeg(inputPath)
                    .toFormat('wav')
                    .audioFrequency(16000)
                    .audioChannels(1)
                    .audioBitrate('128k')
                    .on('end', () => {
                        try {
                            const wavBuffer = fs.readFileSync(outputPath);
                            fs.unlinkSync(inputPath);
                            fs.unlinkSync(outputPath);
                            console.log('✅ Audio conversion successful');
                            resolve(wavBuffer);
                        } catch (error) {
                            reject(error);
                        }
                    })
                    .on('error', (error) => {
                        console.error(`❌ FFmpeg error: ${error.message}`);
                        try { fs.unlinkSync(inputPath); } catch (e) { }
                        try { fs.unlinkSync(outputPath); } catch (e) { }
                        reject(error);
                    })
                    .save(outputPath);

            } catch (error) {
                reject(error);
            }
        });
    }

    getDefaultHotwords() {
        return this.defaultHotWords;
    }

    validateAudioBuffer(buffer, maxSizeMB = 10) {
        if (!buffer || !Buffer.isBuffer(buffer)) {
            return false;
        }

        const maxBytes = maxSizeMB * 1024 * 1024;
        return buffer.length <= maxBytes;
    }
}

module.exports = new VoiceAnalysisService();
