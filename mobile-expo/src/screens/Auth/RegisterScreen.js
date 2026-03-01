import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch } from 'react-redux';
import { authAPI } from '../../api/authAPI';
import { setLoading, setError } from '../../store/slices/authSlice';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoadingState] = useState(false);

  // Verification State
  const [idType, setIdType] = useState('nid'); // default to nid
  const [idNumber, setIdNumber] = useState('');
  const [idCardImage, setIdCardImage] = useState(null);
  const [isIdVerified, setIsIdVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [studentData, setStudentData] = useState(null);

  const dispatch = useDispatch();

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const pickIdCard = async () => {
    if (!idNumber.trim()) {
      Alert.alert('Required', 'Please enter your ID Number first.');
      return;
    }

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setIdCardImage(result.assets[0].uri);
      verifyIdCard(result.assets[0].uri);
    }
  };

  const takeIdCardPhoto = async () => {
    if (!idNumber.trim()) {
      Alert.alert('Required', 'Please enter your ID Number first.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setIdCardImage(result.assets[0].uri);
      verifyIdCard(result.assets[0].uri);
    }
  };

  const verifyIdCard = async (uri) => {
    setVerifying(true);
    try {
      const response = await authAPI.verifyIDCard(uri, idType, idNumber);

      if (response.success && response.is_valid) {
        setIsIdVerified(true);
        setStudentData(response.extracted_data);

        // Auto-fill available data if name is returned
        if (response.extracted_data?.name) {
          setFullName(response.extracted_data.name);
        }

        Alert.alert('Success', 'Identity Verified Successfully!');
      } else {
        setIsIdVerified(false);
        setStudentData(null);
        Alert.alert('Verification Failed', response.reason || 'Could not verify ID.');
      }
    } catch (error) {
      console.error('Verification Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to verify ID card. Please try again.');
      setIsIdVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleNext = async () => {
    // Check ID Verification first
    if (!isIdVerified) {
      Alert.alert('Verification Required', 'Please upload and verify your Student ID card first.');
      return;
    }

    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (!email.trim() || !validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate phone number (Bangladesh format: 01xxxxxxxxx)
    if (!/^01\d{9}$/.test(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid 11-digit phone number (e.g., 01xxxxxxxxx)');
      return;
    }

    if (!password || password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoadingState(true);
    try {
      // Send Phone OTP
      await authAPI.sendOTP(phoneNumber);
      Alert.alert('Success', 'OTP sent to your phone');

      // Navigate to OTP screen
      navigation.navigate('OTPVerification', {
        phoneNumber,
        isLogin: false,
        userData: {
          fullName,
          email,
          phoneNumber,
          password,
          studentId: studentData?.student_id,
          department: studentData?.department
        }
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP';
      Alert.alert('Error', message);
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome to Nirapotta</Text>
      <Text style={styles.subtitle}>Enter your details to get started</Text>

      <Text style={styles.sectionHeader}>1. Identity Verification</Text>

      <View style={styles.verificationContainer}>
        <Text style={styles.label}>Select ID Type</Text>
        <View style={styles.idTypeContainer}>
          <TouchableOpacity
            style={[styles.idTypeButton, idType === 'nid' && styles.idTypeButtonActive]}
            onPress={() => !isIdVerified && setIdType('nid')}
            disabled={isIdVerified}>
            <Text style={[styles.idTypeButtonText, idType === 'nid' && styles.idTypeButtonTextActive]}>
              National ID (NID)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.idTypeButton, idType === 'birth_certificate' && styles.idTypeButtonActive]}
            onPress={() => !isIdVerified && setIdType('birth_certificate')}
            disabled={isIdVerified}>
            <Text style={[styles.idTypeButtonText, idType === 'birth_certificate' && styles.idTypeButtonTextActive]}>
              Birth Certificate
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.input, isIdVerified && styles.inputLocked]}
          placeholder="Enter ID Number"
          value={idNumber}
          onChangeText={setIdNumber}
          keyboardType="numeric"
          editable={!isIdVerified}
        />

        {idCardImage ? (
          <Image source={{ uri: idCardImage }} style={styles.idCardPreview} />
        ) : (
          <View style={styles.idCardPlaceholder}>
            <Text style={styles.placeholderText}>No ID Image Selected</Text>
          </View>
        )}

        {verifying ? (
          <ActivityIndicator size="large" color="#e63946" style={styles.loader} />
        ) : (
          !isIdVerified && (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.uploadButton} onPress={takeIdCardPhoto}>
                <Text style={styles.uploadButtonText}>📷 Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={pickIdCard}>
                <Text style={styles.uploadButtonText}>🖼️ Gallery</Text>
              </TouchableOpacity>
            </View>
          )
        )}

        {isIdVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✅ Verified: {idNumber}</Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionHeader}>2. Personal Details</Text>

      <TextInput
        style={[styles.input, isIdVerified && styles.inputLocked]}
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        editable={!isIdVerified}
      />

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number (e.g., 01712345678)"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password (min 8 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.button, (!isIdVerified || loading) && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!isIdVerified || loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Next</Text>
        )}
      </TouchableOpacity>

      {!isIdVerified && (
        <Text style={styles.helperText}>* You must verify your Student ID to proceed.</Text>
      )}

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        By continuing, you agree to our Terms and Privacy Policy
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    flexGrow: 1,
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#444',
  },
  verificationContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  idCardPreview: {
    width: 200,
    height: 120,
    resizeMode: 'contain',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  idCardPlaceholder: {
    width: 200,
    height: 120,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#888',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  uploadButton: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
    flex: 0.48,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedBadge: {
    marginTop: 10,
    backgroundColor: '#d4edda',
    padding: 8,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#155724',
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 10,
  },
  helperText: {
    color: '#e63946',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  inputLocked: {
    backgroundColor: '#e9ecef',
    color: '#495057',
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
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#e63946',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    marginTop: 30,
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    alignSelf: 'flex-start',
    fontWeight: '600',
  },
  idTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  idTypeButton: {
    flex: 0.48,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  idTypeButtonActive: {
    borderColor: '#e63946',
    backgroundColor: '#fff1f2',
  },
  idTypeButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  idTypeButtonTextActive: {
    color: '#e63946',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
