import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { authAPI } from '../../api/authAPI';

const AppSecuritySetupScreen = ({ navigation }) => {
  const [securityType, setSecurityType] = useState('pin'); // 'pin' or 'password'
  const [secret, setSecret] = useState('');
  const [confirmSecret, setConfirmSecret] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetupSecurity = async () => {
    if (!secret || !confirmSecret) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (secret !== confirmSecret) {
      Alert.alert('Error', 'PIN/Password does not match');
      return;
    }

    if (securityType === 'pin' && !/^\d{4,6}$/.test(secret)) {
      Alert.alert('Error', 'PIN must be 4-6 digits');
      return;
    }

    if (securityType === 'password' && secret.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await authAPI.setupAppSecurity(securityType, secret);
      Alert.alert('Success', 'App security setup successful');
      navigation.replace('Home');
    } catch (error) {
      const message = error.response?.data?.message || 'Setup failed';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip App Security',
      'Are you sure you want to skip? This makes your app less secure.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => navigation.replace('Home') },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Setup App Security</Text>
      <Text style={styles.subtitle}>
        Protect your app with a PIN or password
      </Text>

      <View style={styles.segmentControl}>
        <TouchableOpacity
          style={[
            styles.segment,
            securityType === 'pin' && styles.segmentActive,
          ]}
          onPress={() => setSecurityType('pin')}>
          <Text
            style={[
              styles.segmentText,
              securityType === 'pin' && styles.segmentTextActive,
            ]}>
            PIN (4-6 digits)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segment,
            securityType === 'password' && styles.segmentActive,
          ]}
          onPress={() => setSecurityType('password')}>
          <Text
            style={[
              styles.segmentText,
              securityType === 'password' && styles.segmentTextActive,
            ]}>
            Password
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder={securityType === 'pin' ? 'Enter PIN' : 'Enter Password'}
        value={secret}
        onChangeText={setSecret}
        secureTextEntry
        keyboardType={securityType === 'pin' ? 'number-pad' : 'default'}
        maxLength={securityType === 'pin' ? 6 : undefined}
      />

      <TextInput
        style={styles.input}
        placeholder={
          securityType === 'pin' ? 'Confirm PIN' : 'Confirm Password'
        }
        value={confirmSecret}
        onChangeText={setConfirmSecret}
        secureTextEntry
        keyboardType={securityType === 'pin' ? 'number-pad' : 'default'}
        maxLength={securityType === 'pin' ? 6 : undefined}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSetupSecurity}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Setup Security</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  segmentControl: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  segmentActive: {
    backgroundColor: '#e63946',
    borderColor: '#e63946',
  },
  segmentText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#e63946',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  skipText: {
    color: '#999',
    fontSize: 14,
  },
});

export default AppSecuritySetupScreen;
