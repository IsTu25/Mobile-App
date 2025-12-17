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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { authAPI } from '../../api/authAPI';
import { setLoading, setError, setUser, setTokens } from '../../store/slices/authSlice';

const LoginScreen = ({ navigation }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoadingState] = useState(false);
    const dispatch = useDispatch();

    const handleLogin = async () => {
        if (!phoneNumber.trim()) {
            Alert.alert('Error', 'Please enter your phone number');
            return;
        }

        if (!password) {
            Alert.alert('Error', 'Please enter your password');
            return;
        }

        setLoadingState(true);
        dispatch(setLoading(true));

        try {
            const result = await authAPI.login(phoneNumber, password);

            // Save tokens and user
            if (result.success && result.data.tokens) {
                await AsyncStorage.setItem('accessToken', result.data.tokens.accessToken);
                await AsyncStorage.setItem('refreshToken', result.data.tokens.refreshToken);
                await AsyncStorage.setItem('user', JSON.stringify(result.data.user));

                dispatch(setUser(result.data.user));
                dispatch(setTokens(result.data.tokens));

                // Navigate to Home (or reset stack)
                // Assuming App navigation listens to auth state, or we manually navigate
                // If AuthStack is used, we might need to rely on Redux state change, 
                // but let's navigate to ensure.
                // However, usually we can't navigate to 'Home' if it's in a different stack unless we are in a switch navigator or similar.
                // If using standard stack, we might need to replace current stack.
                // Let's assume the root navigator handles it. But 'OTPScreen' used navigation.replace('Home').
                // Wait, OTPScreen used navigation.replace('AppSecuritySetup') or 'Home'.
                // I'll use navigation.replace('Home').
                navigation.replace('Home');
            } else {
                Alert.alert('Error', 'Login failed');
            }

        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            console.error('Login Error:', error.response?.data || error.message);
            Alert.alert('Error', message);
            dispatch(setError(message));
        } finally {
            setLoadingState(false);
            dispatch(setLoading(false));
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Enter your phone number to login</Text>

            <TextInput
                style={styles.input}
                placeholder="Phone Number (e.g., +8801234567890)"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
            />

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Login</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.navigate('Register')}>
                <Text style={styles.linkText}>Don't have an account? Register</Text>
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
});

export default LoginScreen;
