import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Animated,
    StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../api/authAPI';
import { setLoading, setError, setUser, setTokens } from '../../store/slices/authSlice';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLocalLoading] = useState(false);
    const dispatch = useDispatch();

    // Animation Values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!phoneNumber.trim() || !password) {
            Alert.alert('Incomplete', 'Please provide both phone number and password.');
            return;
        }

        setLocalLoading(true);
        dispatch(setLoading(true));

        try {
            const result = await authAPI.login(phoneNumber, password);

            if (result.success && result.data.tokens) {
                await AsyncStorage.setItem('accessToken', result.data.tokens.accessToken);
                await AsyncStorage.setItem('refreshToken', result.data.tokens.refreshToken);
                await AsyncStorage.setItem('user', JSON.stringify(result.data.user));

                dispatch(setUser(result.data.user));
                dispatch(setTokens(result.data.tokens));

                navigation.replace('Home');
            } else {
                Alert.alert('Access Denied', 'Invalid credentials provided.');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed. Please check your connection.';
            Alert.alert('Login Failed', message);
            dispatch(setError(message));
        } finally {
            setLocalLoading(false);
            dispatch(setLoading(false));
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Background Gradient - Dark & Trustworthy */}
            <LinearGradient
                colors={['#0f172a', '#1e293b', '#334155']}
                style={styles.background}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <Animated.View
                    style={[
                        styles.contentContainer,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    {/* Logo Section */}
                    <View style={styles.logoSection}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="shield-checkmark" size={48} color="#38bdf8" />
                        </View>
                        <Text style={styles.appName}>NIRAPOTTA</Text>
                        <Text style={styles.tagline}>Security & Safety Companion</Text>
                    </View>

                    {/* Form Section - Glass Effect */}
                    <View style={styles.formCard}>
                        <Text style={styles.welcomeText}>Welcome Back</Text>

                        <View style={styles.inputGroup}>
                            <Ionicons name="call-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Phone Number"
                                placeholderTextColor="#64748b"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#64748b"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#38bdf8', '#0284c7']}
                                style={styles.gradientButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.loginButtonText}>SECURE LOGIN</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.registerLink}
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text style={styles.registerText}>
                                New User? <Text style={styles.registerHighlight}>Create Account</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: height,
    },
    keyboardAvoidingView: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    contentContainer: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.2)',
    },
    appName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#f8fafc',
        letterSpacing: 3,
    },
    tagline: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 6,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    formCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderRadius: 24,
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
    },
    welcomeText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#f1f5f9',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.1)',
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#f8fafc',
        fontSize: 16,
        height: '100%',
    },
    loginButton: {
        marginTop: 24,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    gradientButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    registerLink: {
        marginTop: 24,
        alignItems: 'center',
    },
    registerText: {
        color: '#94a3b8',
        fontSize: 14,
    },
    registerHighlight: {
        color: '#38bdf8',
        fontWeight: '600',
    },
});

export default LoginScreen;
