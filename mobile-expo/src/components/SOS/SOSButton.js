import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Vibration,
} from 'react-native';

const SOSButton = ({ onTrigger, disabled = false }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pressTimer = useRef(null);

  const LONG_PRESS_DURATION = 2000; // 2 seconds

  const handlePressIn = () => {
    if (disabled) return;

    setIsPressed(true);
    
    // Scale animation
    Animated.spring(scaleAnim, {
      toValue: 1.1,
      useNativeDriver: true,
    }).start();

    // Progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: LONG_PRESS_DURATION,
      useNativeDriver: false,
    }).start();

    // Progress update
    const startTime = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(elapsed / LONG_PRESS_DURATION, 1);
      setProgress(currentProgress);

      if (currentProgress >= 1) {
        handleTriggerSOS();
      }
    };

    pressTimer.current = setInterval(updateProgress, 50);
  };

  const handlePressOut = () => {
    setIsPressed(false);
    
    // Reset animations
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Clear timer
    if (pressTimer.current) {
      clearInterval(pressTimer.current);
      pressTimer.current = null;
    }

    setProgress(0);
  };

  const handleTriggerSOS = () => {
    // Clear timer
    if (pressTimer.current) {
      clearInterval(pressTimer.current);
      pressTimer.current = null;
    }

    // Vibrate
    Vibration.vibrate([0, 100, 100, 100]);

    // Reset state
    setIsPressed(false);
    setProgress(0);
    
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    // Trigger callback
    if (onTrigger) {
      onTrigger();
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.button,
          { transform: [{ scale: scaleAnim }] },
          disabled && styles.buttonDisabled,
        ]}
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        onTouchCancel={handlePressOut}>
        <TouchableOpacity
          style={styles.touchable}
          activeOpacity={0.8}
          disabled={disabled}>
          <Animated.View
            style={[
              styles.progressBar,
              { width: progressWidth },
            ]}
          />
          <View style={styles.content}>
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.instructions}>
              {isPressed ? `Hold (${Math.round(progress * 100)}%)` : 'Hold for 2s'}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#e63946',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  touchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#d62828',
  },
  content: {
    alignItems: 'center',
    zIndex: 2,
  },
  sosText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  instructions: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
    fontWeight: '600',
  },
});

export default SOSButton;
