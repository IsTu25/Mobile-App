import numpy as np
import soundfile as sf
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from audio_analytics.audio_classifier import AudioDangerClassifier

def test_audio_classifier():
    """Test the audio classifier with a sample audio file"""
    
    print("=" * 50)
    print("Testing Audio Danger Classifier")
    print("=" * 50)
    
    # Initialize classifier
    classifier = AudioDangerClassifier()
    
    # Test with a simple synthetic audio (simulating a scream-like sound)
    print("\n📝 Generating test audio (high-pitched tone)...")
    sample_rate = 16000
    duration = 2  # seconds
    frequency = 1000  # Hz (high pitch)
    
    t = np.linspace(0, duration, int(sample_rate * duration))
    # Create a modulated tone that might trigger scream detection
    waveform = np.sin(2 * np.pi * frequency * t) * np.sin(2 * np.pi * 5 * t)
    waveform = waveform.astype(np.float32)
    
    # Analyze
    print("🎵 Analyzing audio...")
    result = classifier.analyze_audio(waveform, sample_rate)
    
    # Display results
    print("\n" + "=" * 50)
    print("RESULTS")
    print("=" * 50)
    print(f"Top Detection: {result['detected_class']}")
    print(f"Confidence: {result['confidence']:.2%}")
    print(f"Is Danger: {'⚠️ YES' if result['is_danger'] else '✅ NO'}")
    if result['danger_threshold'] > 0:
        print(f"Danger Threshold: {result['danger_threshold']:.2%}")
    
    print("\nTop 5 Predictions:")
    for i, pred in enumerate(result['all_predictions'], 1):
        print(f"  {i}. {pred['class']}: {pred['confidence']:.2%}")
    
    print("\n" + "=" * 50)
    print("✅ Test Complete!")
    print("=" * 50)

if __name__ == '__main__':
    test_audio_classifier()
