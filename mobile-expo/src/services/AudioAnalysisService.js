import { Audio } from 'expo-av';
import { deleteAsync } from 'expo-file-system/legacy';
import axios from 'axios';

class AudioAnalysisService {
    constructor() {
        this.recording = null;
        this.isMonitoring = false;
        this.onDangerDetected = null;
        this.apiUrl = 'http://172.20.10.2:5001/analyze-audio';
        this.recordingInterval = null;
        this.dangerThreshold = 0.75; // Trigger SOS if danger confidence > 75%
    }

    /**
     * Start audio monitoring for danger sounds
     */
    async startMonitoring(onDangerCallback) {
        try {
            console.log('[AudioAnalysis] Starting audio monitoring...');

            // Request permissions
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Audio permission not granted');
            }

            // Configure audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
            });

            this.onDangerDetected = onDangerCallback;
            this.isMonitoring = true;

            // Start continuous recording loop
            this._startRecordingLoop();

            console.log('[AudioAnalysis] ✅ Monitoring started');
            return { success: true };
        } catch (error) {
            console.error('[AudioAnalysis] Failed to start monitoring:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Stop audio monitoring
     */
    async stopMonitoring() {
        try {
            console.log('[AudioAnalysis] Stopping audio monitoring...');

            this.isMonitoring = false;

            if (this.recordingInterval) {
                clearInterval(this.recordingInterval);
                this.recordingInterval = null;
            }

            if (this.recording) {
                await this.recording.stopAndUnloadAsync();
                this.recording = null;
            }

            console.log('[AudioAnalysis] ✅ Monitoring stopped');
            return { success: true };
        } catch (error) {
            console.error('[AudioAnalysis] Error stopping monitoring:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Internal: Continuous recording loop
     */
    _startRecordingLoop() {
        // Record 2-second clips every 3 seconds
        this.recordingInterval = setInterval(async () => {
            if (!this.isMonitoring) return;

            try {
                await this._recordAndAnalyze();
            } catch (error) {
                console.error('[AudioAnalysis] Recording error:', error);
            }
        }, 3000);
    }

    /**
     * Internal: Record a short clip and send for analysis
     */
    async _recordAndAnalyze() {
        try {
            // Start recording
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY,
                null,
                100 // Update interval in ms
            );

            this.recording = recording;

            // Record for 2 seconds
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Stop recording
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();

            if (!uri) {
                console.warn('[AudioAnalysis] No recording URI');
                return;
            }

            // Send to server for analysis
            const result = await this._analyzeAudio(uri);

            // Check for danger
            if (result && result.is_danger) {
                console.warn(`[AudioAnalysis] ⚠️ DANGER DETECTED: ${result.detected_class} (${(result.confidence * 100).toFixed(1)}%)`);

                if (this.onDangerDetected) {
                    this.onDangerDetected({
                        soundClass: result.detected_class,
                        confidence: result.confidence,
                        timestamp: new Date().toISOString()
                    });
                }
            } else if (result) {
                console.log(`[AudioAnalysis] Safe: ${result.detected_class} (${(result.confidence * 100).toFixed(1)}%)`);
            }

            // Clean up file
            await deleteAsync(uri, { idempotent: true });

        } catch (error) {
            console.error('[AudioAnalysis] Record and analyze error:', error);
        } finally {
            this.recording = null;
        }
    }

    /**
     * Internal: Send audio file to server for analysis
     */
    async _analyzeAudio(audioUri) {
        try {
            const formData = new FormData();
            formData.append('audio', {
                uri: audioUri,
                type: 'audio/m4a',
                name: 'audio.m4a',
            });

            const response = await axios.post(this.apiUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 5000,
            });

            return response.data;
        } catch (error) {
            console.error('[AudioAnalysis] API error:', error.message);
            return null;
        }
    }

    /**
     * Update API URL (for IP changes)
     */
    setApiUrl(url) {
        this.apiUrl = url;
    }

    /**
     * Update danger threshold
     */
    setDangerThreshold(threshold) {
        this.dangerThreshold = threshold;
    }
}

export default new AudioAnalysisService();
