import { Audio } from 'expo-av';
import { Platform } from 'react-native';

class ScreamDetectionService {
    constructor() {
        this.recording = null;
        this.isMonitoring = false;
        this.onScreamDetected = null;
        this.onVolumeUpdate = null;
        this.lastTriggerTime = 0;

        // Custom Thresholds (0.0 to 1.0 based on metering -dB)
        // Metering usually returns -160 to 0 dB
        this.screamThresholddB = -40; // -10 dB is VERY loud/scream
        this.consecutiveSamplesRequired = 3;
        this.samplesAboveThreshold = 0;

        // Settings
        this.sensitivity = 0.5; // 0 (Silent) to 1 (Restrictive)
        this.mode = 'alert'; // 'alert' shows user prompt, 'auto' triggers SOS
    }

    setScreamThreshold(dB) {
        this.screamThresholddB = dB;
        console.log(`[ScreamDetect] Threshold set to: ${dB} dB`);
    }

    setSensitivity(value) {
        this.sensitivity = Math.max(0, Math.min(1, value));
        // Map 0-1 to -100 to -10 dB
        this.screamThresholddB = -100 + (this.sensitivity * 90);
        console.log(`[ScreamDetect] Sensitivity set to: ${this.screamThresholddB} dB`);
    }

    setCallbacks(onScreamDetected, onVolumeUpdate) {
        this.onScreamDetected = onScreamDetected;
        this.onVolumeUpdate = onVolumeUpdate;
    }

    async startMonitoring() {
        if (this.isMonitoring) return { success: true };

        try {
            console.log('[ScreamDetect] Starting Audio Monitoring...');

            // 1. Permissions
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                return { success: false, error: 'Microphone permission required.' };
            }

            // 2. Configure Audio Category
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
                staysActiveInBackground: true,
            });

            // 3. Setup Recording with Metering
            const recording = new Audio.Recording();
            await recording.prepareToRecordAsync({
                android: {
                    extension: '.m4a',
                    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                    audioEncoder: Audio.AndroidAudioEncoder.AAC,
                    sampleRate: 44100,
                    numberOfChannels: 1,
                    bitRate: 128000,
                },
                ios: {
                    extension: '.caf',
                    audioQuality: Audio.IOSAudioQuality.LOW,
                    sampleRate: 44100,
                    numberOfChannels: 1,
                    bitRate: 128000,
                    linearPCMBitDepth: 16,
                    linearPCMIsBigEndian: false,
                    linearPCMIsFloat: false,
                },
                isMeteringEnabled: true,
            });

            recording.setOnRecordingStatusUpdate(this.onRecordingStatusUpdate.bind(this));

            await recording.startAsync();
            this.recording = recording;
            this.isMonitoring = true;
            this.samplesAboveThreshold = 0;

            return { success: true };
        } catch (e) {
            console.error('[ScreamDetect] Start Error:', e);
            return { success: false, error: e.message };
        }
    }

    async stopMonitoring() {
        if (!this.isMonitoring) return;

        try {
            console.log('[ScreamDetect] Stopping Audio Monitoring...');
            if (this.recording) {
                await this.recording.stopAndUnloadAsync();
            }
            this.recording = null;
            this.isMonitoring = false;
        } catch (e) {
            console.error('[ScreamDetect] Stop Error:', e);
        }
    }

    onRecordingStatusUpdate(status) {
        if (!status.canRecord || !status.isRecording || status.metering === undefined) return;

        // Metering is in dBFS (-160 to 0)
        const db = Math.round(status.metering);

        // Normalize for UI (roughly -160 to 0 -> 0 to 1)
        const normalizedVolume = Math.max(0, (db + 160) / 160);
        if (this.onVolumeUpdate) this.onVolumeUpdate(normalizedVolume, db);

        // Scream Logic
        if (db >= this.screamThresholddB) {
            this.samplesAboveThreshold++;

            // Only trigger if we meet the requirement (e.g. 3 consecutive loud samples)
            if (this.samplesAboveThreshold >= this.consecutiveSamplesRequired) {
                this.triggerScream(db, normalizedVolume);
                this.samplesAboveThreshold = 0; // Reset
            }
        } else {
            this.samplesAboveThreshold = Math.max(0, this.samplesAboveThreshold - 1);
        }
    }

    triggerScream(db, volume) {
        const now = Date.now();
        // 10-second debounce
        if (now - this.lastTriggerTime < 10000) return;

        this.lastTriggerTime = now;
        console.log(`!!! SCREAM DETECTED !!! Level: ${db}dB (${(volume * 100).toFixed(0)}%)`);

        // Confidence logic: A scream is louder than normal peak sound (-10 to 0 is very loud)
        let confidence = (db + 60) / 60; // Just a simple confidence scale
        confidence = Math.max(0, Math.min(1, confidence));

        if (this.onScreamDetected) {
            this.onScreamDetected({
                confidence,
                volume: volume,
                db: db,
                timestamp: now
            });
        }
    }
}

export default new ScreamDetectionService();
