import numpy as np
import tensorflow as tf
import tensorflow_hub as hub

class AudioDangerClassifier:
    """
    Audio classifier using YAMNet for detecting danger sounds
    (screams, gunshots, glass breaking, etc.)
    """
    
    # Danger-related sound classes from YAMNet's 521 classes
    DANGER_CLASSES = {
        'Speech': 0.8,  # FOR TESTING: Trigger on loud speech
        'Screaming': 0.8,
        'Scream': 0.8,
        'Gunshot, gunfire': 0.9,
        'Machine gun': 0.9,
        'Explosion': 0.85,
        'Glass': 0.7,
        'Shatter': 0.75,
        'Crash': 0.7,
        'Breaking': 0.7,
        'Siren': 0.6,
        'Emergency vehicle': 0.6,
        'Fire alarm': 0.7,
        'Smoke detector, smoke alarm': 0.7
    }
    
    def __init__(self):
        """Initialize the YAMNet model"""
        print("🎵 Loading YAMNet audio classification model...")
        self.model = hub.load('https://tfhub.dev/google/yamnet/1')
        
        # Load class names
        self.class_names = self._load_class_names()
        print(f"✅ YAMNet loaded with {len(self.class_names)} audio classes")
        
    def _load_class_names(self):
        """Load YAMNet class names from the model"""
        class_map_path = self.model.class_map_path().numpy()
        class_names = []
        
        with tf.io.gfile.GFile(class_map_path) as f:
            next(f)  # Skip header row
            for line in f:
                parts = line.strip().split(',')
                if len(parts) >= 3:
                    class_names.append(parts[2])  # Display name
                    
        return class_names
    
    def analyze_audio(self, waveform, sample_rate=16000):
        """
        Analyze audio waveform for danger sounds
        
        Args:
            waveform: Audio waveform as numpy array
            sample_rate: Sample rate (YAMNet expects 16kHz)
            
        Returns:
            dict with detected_class, confidence, is_danger, and all_predictions
        """
        # Ensure waveform is float32
        if waveform.dtype != np.float32:
            waveform = waveform.astype(np.float32)
            
        # Normalize to [-1, 1] if needed
        if waveform.max() > 1.0 or waveform.min() < -1.0:
            waveform = waveform / np.max(np.abs(waveform))
        
        # Run inference
        scores, embeddings, spectrogram = self.model(waveform)
        
        # Get top predictions (average across time)
        mean_scores = np.mean(scores.numpy(), axis=0)
        top_indices = np.argsort(mean_scores)[::-1][:5]
        
        # Build predictions list
        predictions = []
        for idx in top_indices:
            class_name = self.class_names[idx]
            confidence = float(mean_scores[idx])
            predictions.append({
                'class': class_name,
                'confidence': confidence
            })
        
        # Check for danger sounds
        top_class = predictions[0]['class']
        top_confidence = predictions[0]['confidence']
        
        is_danger = False
        danger_threshold = 0.0
        
        for danger_class, threshold in self.DANGER_CLASSES.items():
            if danger_class.lower() in top_class.lower():
                danger_threshold = threshold
                if top_confidence >= threshold:
                    is_danger = True
                break
        
        return {
            'detected_class': top_class,
            'confidence': top_confidence,
            'is_danger': is_danger,
            'danger_threshold': danger_threshold,
            'all_predictions': predictions
        }
