import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    TextInput,
    Image,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../api/apiClient';

const DashboardScreen = ({ navigation }) => {
    const { user } = useSelector(state => state.auth);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [profileData, setProfileData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        phone: user?.phoneNumber || '', // Immutable
        bloodGroup: '',
        address: '',
        medicalCondition: '',
        gender: '',
        profilePhoto: null
    });

    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await apiClient.get('/user/profile');
            if (response.data.success) {
                const u = response.data.data;
                setProfileData({
                    fullName: u.fullName || '',
                    email: u.email || '',
                    phone: u.phoneNumber || '',
                    bloodGroup: u.bloodGroup || '',
                    address: u.address || '',
                    medicalCondition: u.medicalCondition || '',
                    gender: u.gender || '',
                    profilePhoto: u.profilePhoto
                });
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
            Alert.alert('Error', 'Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission Refused", "You need to allow access to your photos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            uploadPhoto(result.assets[0].uri);
        }
    };

    const uploadPhoto = async (uri) => {
        // Optimistic Update
        const oldPhoto = profileData.profilePhoto;
        setProfileData(prev => ({ ...prev, profilePhoto: uri }));
        setSaving(true);

        try {
            const formData = new FormData();
            formData.append('photo', {
                uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                type: 'image/jpeg',
                name: 'profile_photo.jpg',
            });

            const response = await apiClient.post('/user/profile/photo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setProfileData(prev => ({ ...prev, profilePhoto: response.data.data.profilePhoto }));
                Alert.alert('Success', 'Profile photo updated');
            }
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Failed to upload photo');
            // Revert
            setProfileData(prev => ({ ...prev, profilePhoto: oldPhoto }));
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await apiClient.put('/user/profile', {
                fullName: profileData.fullName,
                email: profileData.email,
                bloodGroup: profileData.bloodGroup,
                address: profileData.address,
                medicalCondition: profileData.medicalCondition,
                gender: profileData.gender
            });

            if (response.data.success) {
                Alert.alert('Saved', 'Profile updated successfully');
                setEditMode(false);
            }
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Error', 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#38bdf8" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#0f172a', '#1e293b']}
                style={styles.background}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Dashboard</Text>
                <TouchableOpacity onPress={() => editMode ? handleSave() : setEditMode(true)}>
                    {saving ? (
                        <ActivityIndicator color="#38bdf8" size="small" />
                    ) : (
                        <Text style={styles.editButton}>{editMode ? 'Save' : 'Edit'}</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Profile Photo Section */}
                <View style={styles.photoSection}>
                    <TouchableOpacity onPress={handlePickImage} style={styles.photoContainer}>
                        {profileData.profilePhoto ? (
                            <Image source={{ uri: profileData.profilePhoto }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Ionicons name="person" size={40} color="#94a3b8" />
                            </View>
                        )}
                        <View style={styles.editBadge}>
                            <Ionicons name="camera" size={12} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.userName}>{profileData.fullName}</Text>
                    <Text style={styles.userPhone}>{profileData.phone}</Text>
                </View>

                {/* Info Form */}
                <View style={styles.formContainer}>
                    <InfoField label="Full Name" value={profileData.fullName} onChangeText={(t) => setProfileData({ ...profileData, fullName: t })} editable={editMode} />
                    <InfoField label="Email" value={profileData.email} onChangeText={(t) => setProfileData({ ...profileData, email: t })} editable={editMode} keyboardType="email-address" />
                    <InfoField label="Blood Group" value={profileData.bloodGroup} onChangeText={(t) => setProfileData({ ...profileData, bloodGroup: t })} editable={editMode} placeholder="e.g. O+" />
                    <InfoField label="Gender" value={profileData.gender} onChangeText={(t) => setProfileData({ ...profileData, gender: t })} editable={editMode} placeholder="Male/Female/Other" />
                    <InfoField label="Address" value={profileData.address} onChangeText={(t) => setProfileData({ ...profileData, address: t })} editable={editMode} multiline />
                    <InfoField label="Medical Conditions" value={profileData.medicalCondition} onChangeText={(t) => setProfileData({ ...profileData, medicalCondition: t })} editable={editMode} multiline placeholder="Allergies, Diabetes, etc." />
                </View>

            </ScrollView>
        </View>
    );
};

const InfoField = ({ label, value, onChangeText, editable, keyboardType, multiline, placeholder }) => (
    <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
            style={[
                styles.input,
                !editable && styles.inputDisabled,
                multiline && styles.inputMultiline
            ]}
            value={value}
            onChangeText={onChangeText}
            editable={editable}
            placeholder={placeholder || `Enter ${label}`}
            placeholderTextColor="#64748b"
            keyboardType={keyboardType}
            multiline={multiline}
        />
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    center: { justifyContent: 'center', alignItems: 'center' },
    background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
    },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
    editButton: { color: '#38bdf8', fontWeight: 'bold', fontSize: 16 },

    scrollContent: { paddingBottom: 40 },

    photoSection: { alignItems: 'center', marginVertical: 20 },
    photoContainer: { position: 'relative', marginBottom: 15 },
    profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#38bdf8' },
    photoPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#334155' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#38bdf8', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0f172a' },

    userName: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
    userPhone: { fontSize: 14, color: '#94a3b8' },

    formContainer: { paddingHorizontal: 20 },
    fieldContainer: { marginBottom: 20 },
    label: { color: '#94a3b8', fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
    input: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 16,
    },
    inputDisabled: {
        backgroundColor: 'transparent',
        borderWidth: 0, // Look cleaner when reading
        borderColor: 'transparent',
        paddingLeft: 0,
        color: '#e2e8f0'
    },
    inputMultiline: {
        minHeight: 80,
        textAlignVertical: 'top'
    }
});

export default DashboardScreen;
