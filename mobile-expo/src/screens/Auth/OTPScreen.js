import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { authAPI } from '../../api/authAPI';
import { setUser, setTokens } from '../../store/slices/authSlice';

const OTPScreen = ({ route, navigation }) => {
  const { phoneNumber, fullName, email, isLogin, userData } = route.params; // userData from RegisterScreen
  const [otp, setOTP] = useState(''); // Phone OTP
  const [emailOtp, setEmailOtp] = useState(''); // Email OTP
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit Phone OTP');
      return;
    }

    if (isLogin) {
      // Login flow
      setLoading(true);
      try {
        const result = await authAPI.verifyOTP(phoneNumber, otp, fullName, email); // verifyOTP (logs in)

        await AsyncStorage.setItem('accessToken', result.data.tokens.accessToken);
        await AsyncStorage.setItem('refreshToken', result.data.tokens.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(result.data.user));

        dispatch(setUser(result.data.user));
        dispatch(setTokens(result.data.tokens));

        Alert.alert('Success', result.message);
        // Navigate to home
        navigation.replace('Home');
      } catch (error) {
        const message = error.response?.data?.message || 'OTP verification failed';
        Alert.alert('Error', message);
      } finally {
        setLoading(false);
      }
    } else {
      // Registration flow -> Go to Password Confirm with OTP
      // We don't verify OTP here against backend because backend verifyOTP creates user.
      // We will verify OTP during final registration.
      // Or we can verify boolean if we had an endpoint.
      // For now, let's trust the user entered it and pass it to PasswordConfirm.
      // PasswordConfirm will call register(userData + otp).

      navigation.navigate('EmailOTP', {
        userData: {
          ...userData,
          otp // Pass the entered Phone OTP
        }
      });
    }
  };

  const handleResendOTP = async () => {
    try {
      await authAPI.sendOTP(phoneNumber);
      if (!isLogin && email) {
        await authAPI.sendEmailOTP(email);
      }
      Alert.alert('Success', 'OTPs resent successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>

      {/* Phone OTP Section */}
      <Text style={styles.subtitle}>
        Enter 6-digit code sent to {phoneNumber}
      </Text>
      <TextInput
        style={styles.otpInput}
        placeholder="Phone OTP"
        value={otp}
        onChangeText={setOTP}
        keyboardType="number-pad"
        maxLength={6}
        textAlign="center"
      />

      {/* Email OTP Section - Only for Registration */}
      {!isLogin && email && (
        <>
          <Text style={styles.subtitle}>
            Enter 6-digit code sent to {email}
          </Text>
          <TextInput
            style={styles.otpInput}
            placeholder="Email OTP"
            value={emailOtp}
            onChangeText={setEmailOtp}
            keyboardType="number-pad" // or default if alphanumeric, but usually numeric
            maxLength={6}
            textAlign="center"
          />
        </>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerifyOTP}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify & Proceed</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResendOTP} style={styles.resendButton}>
        <Text style={styles.resendText}>Didn't receive code? Resend</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    marginTop: 10,
    textAlign: 'center',
  },
  otpInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
  },
  button: {
    backgroundColor: '#e63946',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    color: '#e63946',
    fontSize: 14,
  },
});

export default OTPScreen;
