// import Voice from '@react-native-voice/voice';

let Voice = null;

try {
    Voice = require('@react-native-voice/voice').default;
} catch (e) {
    console.warn("Voice module not loaded:", e);
}

// Fallback Mock if Voice is null (or NativeModule missing)
// MOCK VOICE FOR EXPO GO (Real Native Module doesn't work in Go)
if (!Voice) {
    console.warn("Using Mock Voice for Expo Go");
    Voice = {
        onSpeechResults: null,
        onSpeechError: null,
        onSpeechEnd: null,
        start: async () => console.warn('[VoiceTrigger] Mock Start (Native Module unavailable in Expo Go)'),
        stop: async () => console.log("[Mock] Voice.stop"),
        destroy: async () => console.log("[Mock] Voice.destroy"),
        isAvailable: async () => false,
    };
}

class VoiceTriggerService {
    constructor() {
        this.triggerWord = 'help'; // Default
        this.isListening = false;
        this.onTrigger = null;
        this.onError = null;

        // Bind events
        if (Voice) {
            Voice.onSpeechResults = this.onSpeechResults.bind(this);
            Voice.onSpeechError = this.onSpeechError.bind(this);
            Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
        }
    }

    setTriggerWord(word) {
        this.triggerWord = word.toLowerCase();
        console.log(`[VoiceTrigger] Trigger word set to: "${this.triggerWord}"`);
    }

    setCallbacks(onTrigger, onError) {
        this.onTrigger = onTrigger;
        this.onError = onError;
    }

    async startListening() {
        if (this.isListening) return;

        try {
            console.log('[VoiceTrigger] Starting listener...');
            // Check if native module is linked
            if (!Voice || !Voice.start || Voice.isAvailable && !Voice.isAvailable()) {
                console.warn('[VoiceTrigger] Native Module missing. Are you using Expo Go? Use a Development Build.');
                if (this.onError) this.onError(new Error("Voice module missing. Use 'npx expo run:android' or 'npx expo run:ios' to test this feature."));
                return;
            }

            await Voice.start('en-US');
            this.isListening = true;
        } catch (e) {
            console.error('[VoiceTrigger] Start Error:', e);
            if (this.onError) this.onError(e);
        }
    }

    async stopListening() {
        if (!this.isListening) return;

        try {
            console.log('[VoiceTrigger] Stopping listener...');
            await Voice.stop();
            await Voice.destroy();
            this.isListening = false;
        } catch (e) {
            console.error('[VoiceTrigger] Stop Error:', e);
        }
    }

    onSpeechResults(e) {
        if (!e.value) return;

        console.log('[VoiceTrigger] Heard:', e.value);

        const heardPhrases = e.value.map(phrase => phrase.toLowerCase());
        const match = heardPhrases.some(phrase => phrase.includes(this.triggerWord));

        if (match) {
            console.log('!!! TRIGGER DETECTED !!!');
            if (this.onTrigger) this.onTrigger();
            this.stopListening(); // Stop after trigger to avoid double-fire
        } else {
            // Restart listening if stopped implicitly (Android sometimes stops after results)
            // Or just keep going. 
            // Note: Continuous listening often requires restarting the service on 'onSpeechEnd'
        }
    }

    onSpeechEnd(e) {
        console.log('[VoiceTrigger] Speech Ended', e);
        this.isListening = false;
        // Auto-restart? 
        // For a seamless "Always On" experience while app is open, we should restart.
        // But let's be careful about infinite loops if there's an error.
        this.startListening();
    }

    onSpeechError(e) {
        console.log('[VoiceTrigger] Speech Error', e);
        // Errors like '7' (No match) are common. Ignorable.
        // We should try to restart if allow.

        // Wait 1s and restart
        setTimeout(() => {
            if (!this.isListening) this.startListening();
        }, 1000);
    }
}

export default new VoiceTriggerService();
