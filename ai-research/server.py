import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
import io
import soundfile as sf
from audio_analytics.audio_classifier import AudioDangerClassifier

app = Flask(__name__)
CORS(app)

print("Loading Gut Feeling Model...")
gut_feeling_model = tf.keras.models.load_model('gut_feeling_model.h5')
print("✅ Gut Feeling Model Loaded!")

print("Loading Audio Danger Classifier...")
audio_classifier = AudioDangerClassifier()
print("✅ Audio Danger Classifier Loaded!")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'models': 'loaded'}), 200

@app.route('/predict', methods=['POST'])
def predict():
    """Gut Feeling prediction endpoint"""
    try:
        data = request.json
        # Expecting 'sensor_data': [[ax, ay, az, gx, gy, gz], ... 128 times ...]
        sensor_data = np.array(data['sensor_data'])
        
        # Reshape to (1, 128, 6)
        if sensor_data.shape != (128, 6):
            return jsonify({"error": f"Invalid shape. Expected (128, 6), got {sensor_data.shape}"}), 400
            
        input_data = np.expand_dims(sensor_data, axis=0)
        
        prediction = gut_feeling_model.predict(input_data, verbose=0)
        risk_score = float(prediction[0][0])
        
        print(f"Gut Feeling Risk Score: {risk_score}")
        
        return jsonify({
            "risk_score": risk_score,
            "status": "DANGER" if risk_score > 0.8 else "SAFE"
        })
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/analyze-audio', methods=['POST'])
def analyze_audio():
    """
    Analyze uploaded audio for danger sounds
    Expects: audio file in request.files['audio']
    Returns: danger detection results
    """
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        # Read audio file
        audio_bytes = audio_file.read()
        
        # Try to read with soundfile first (for WAV)
        try:
            waveform, sample_rate = sf.read(io.BytesIO(audio_bytes))
        except:
            # If soundfile fails, try converting with pydub (for M4A, MP3, etc.)
            from pydub import AudioSegment
            import tempfile
            
            # Save to temp file
            with tempfile.NamedTemporaryFile(suffix='.m4a', delete=False) as temp_input:
                temp_input.write(audio_bytes)
                temp_input_path = temp_input.name
            
            # Convert to WAV
            audio = AudioSegment.from_file(temp_input_path)
            
            # Export as WAV to BytesIO
            wav_io = io.BytesIO()
            audio.export(wav_io, format='wav')
            wav_io.seek(0)
            
            # Read with soundfile
            waveform, sample_rate = sf.read(wav_io)
            
            # Cleanup
            import os
            os.unlink(temp_input_path)
        
        # Convert to mono if stereo
        if len(waveform.shape) > 1:
            waveform = np.mean(waveform, axis=1)
        
        # Resample to 16kHz if needed (YAMNet expects 16kHz)
        if sample_rate != 16000:
            import scipy.signal
            num_samples = int(len(waveform) * 16000 / sample_rate)
            waveform = scipy.signal.resample(waveform, num_samples)
        
        # Analyze audio
        result = audio_classifier.analyze_audio(waveform)
        
        print(f"🎵 Audio Analysis: {result['detected_class']} ({result['confidence']:.2%}) - Danger: {result['is_danger']}")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Audio analysis error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run on port 5001 to avoid conflict with Node backend (3000) or React (8081)
    app.run(host='0.0.0.0', port=5001)
