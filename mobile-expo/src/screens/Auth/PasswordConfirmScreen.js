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
import { useDispatch } from 'react-redux';
import { authAPI } from '../../api/authAPI';
import { setLoading, setError } from '../../store/slices/authSlice';

const PasswordConfirmScreen = ({ route, navigation }) => {
    const { userData } = route.params;
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoadingState] = useState(false);
    const dispatch = useDispatch();

    const handleRegister = async () => {
        if (!confirmPassword) {
            Alert.alert('Error', 'Please confirm your password');
            return;
        }

        if (confirmPassword !== userData.password) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoadingState(true);
        dispatch(setLoading(true));

        try {
            await authAPI.register(userData);
            Alert.alert('Success', 'Registration successful. Please login.');
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed';
            console.error('Registration Error:', error.response?.data || error.message);
            Alert.alert('Error', message);
            dispatch(setError(message));
        } finally {
            setLoadingState(false);
            dispatch(setLoading(false));
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Confirm Password</Text>
            <Text style={styles.subtitle}>Please re-enter your password to confirm</Text>

            <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
            />

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Confirm & Register</Text>
                )}
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
});

export default PasswordConfirmScreen;
