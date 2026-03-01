import Voice from '@react-native-voice/voice';
import { Platform } from 'react-native';

class VoiceTriggerService {
    constructor() {
        this.triggerWord = 'help';
        this.isListening = false;
        this.shouldBeActive = false;
        this.onTrigger = null;
        this.onError = null;
        this.onVolumeChange = null;
        this.lastTriggerTime = 0;

        // Intensity/Volume Settings
        this.volumeThreshold = 0.7; // 0.0 to 1.0 (70%)
        this.requireLoudness = true;
        this.detectAnyScream = false;
        this.currentVolume = 0;
        this.peakVolume = 0;

        // Bind events
        Voice.onSpeechResults = this.onSpeechResults.bind(this);
        Voice.onSpeechError = this.onSpeechError.bind(this);
        Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
        Voice.onSpeechVolumeChanged = this.onSpeechVolumeChanged.bind(this);
    }

    setTriggerWord(word) {
        this.triggerWord = word.toLowerCase();
        console.log(`[VoiceTrigger] Trigger word: "${this.triggerWord}"`);
    }

    setVolumeThreshold(threshold) {
        this.volumeThreshold = threshold;
        console.log(`[VoiceTrigger] Volume threshold: ${threshold}`);
    }

    setRequireLoudness(required) {
        this.requireLoudness = required;
        console.log(`[VoiceTrigger] Require loudness: ${required}`);
    }

    setDetectAnyScream(enabled) {
        this.detectAnyScream = enabled;
        console.log(`[VoiceTrigger] Detect any scream: ${enabled}`);
    }

    setCallbacks(onTrigger, onError, onVolumeChange) {
        this.onTrigger = onTrigger;
        this.onError = onError;
        this.onVolumeChange = onVolumeChange;
    }

    async startListening() {
        this.shouldBeActive = true;
        if (this.isListening) return;

        try {
            console.log('[VoiceTrigger] Initializing Enhanced Voice Listener...');

            // Check if available
            const isAvailable = await Voice.isAvailable();
            if (!isAvailable) {
                throw new Error("Voice recognition not available on this device.");
            }

            await Voice.start('en-US');
            this.isListening = true;
            this.peakVolume = 0;
        } catch (e) {
            console.error('[VoiceTrigger] Start Error:', e);
            if (this.onError) this.onError(e);

            if (this.shouldBeActive) {
                setTimeout(() => this.startListening(), 2000);
            }
        }
    }

    async stopListening() {
        this.shouldBeActive = false;
        if (!this.isListening) return;

        try {
            console.log('[VoiceTrigger] Stopping listener...');
            await Voice.stop();
            await Voice.destroy();
            this.isListening = false;
            this.currentVolume = 0;
        } catch (e) {
            console.error('[VoiceTrigger] Stop Error:', e);
        }
    }

    onSpeechVolumeChanged(e) {
        // e.value is typically -2 to 10 or 0 to 100 depending on platform
        // Normalize to 0-1 range roughly
        let volume = 0;
        if (Platform.OS === 'android') {
            // Android: approx 0 to 10
            volume = Math.max(0, e.value) / 10;
        } else {
            // iOS: approx -2 to 10
            volume = (e.value + 2) / 12;
        }

        this.currentVolume = Math.min(1, volume);
        if (this.currentVolume > this.peakVolume) {
            this.peakVolume = this.currentVolume;
        }

        if (this.onVolumeChange) {
            this.onVolumeChange(this.currentVolume);
        }

        // Mode: Detect ANY loud scream (even without words)
        if (this.detectAnyScream && this.currentVolume > 0.95) {
            this.triggerDetected("Loud Scream");
        }
    }

    onSpeechResults(e) {
        if (!e.value) return;

        const heardPhrases = e.value.map(phrase => phrase.toLowerCase());
        const match = heardPhrases.some(phrase => phrase.includes(this.triggerWord));

        if (match) {
            console.log(`[VoiceTrigger] Heard trigger word. Peak Volume: ${(this.peakVolume * 100).toFixed(0)}%`);

            if (this.requireLoudness) {
                if (this.peakVolume >= this.volumeThreshold) {
                    this.triggerDetected("Loud Voice Command");
                } else {
                    console.log(`[VoiceTrigger] Trigger word detected but not loud enough (${(this.peakVolume * 100).toFixed(0)}% < ${(this.volumeThreshold * 100).toFixed(0)}%)`);
                }
            } else {
                this.triggerDetected("Voice Command (Any Volume)");
            }
        }
    }

    triggerDetected(reason) {
        const now = Date.now();
        if (now - this.lastTriggerTime < 10000) return;

        this.lastTriggerTime = now;
        console.log(`!!! ${reason.toUpperCase()} TRIGGERED SOS !!!`);

        if (this.onTrigger) this.onTrigger(reason);
        this.stopListening();
    }

    onSpeechEnd(e) {
        this.isListening = false;
        if (this.shouldBeActive) {
            setTimeout(() => this.startListening(), 500);
        }
    }

    onSpeechError(e) {
        // Error code 7 is annoying network/timeout on Android
        if (e.error?.code === '7') {
            // Silently ignore or retry
        } else {
            console.log('[VoiceTrigger] Error:', e);
        }

        this.isListening = false;
        if (this.shouldBeActive) {
            setTimeout(() => this.startListening(), 1000);
        }
    }
}

export default new VoiceTriggerService();
