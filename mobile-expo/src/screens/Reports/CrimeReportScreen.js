import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform,
    Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '../../api/apiClient';

const CATEGORIES = [
    { id: 'Theft/Robbery', label: 'Theft/Robbery', icon: 'cash-outline', color: '#ef4444' },
    { id: 'Assault', label: 'Assault', icon: 'alert-circle-outline', color: '#dc2626' },
    { id: 'Harassment', label: 'Harassment', icon: 'warning-outline', color: '#f59e0b' },
    { id: 'Vandalism', label: 'Vandalism', icon: 'hammer-outline', color: '#f97316' },
    { id: 'Drug Activity', label: 'Drug Activity', icon: 'flask-outline', color: '#8b5cf6' },
    { id: 'Traffic Violation', label: 'Traffic Violation', icon: 'car-outline', color: '#eab308' },
    { id: 'Fraud/Scam', label: 'Fraud/Scam', icon: 'card-outline', color: '#06b6d4' },
    { id: 'Domestic Violence', label: 'Domestic Violence', icon: 'home-outline', color: '#be123c' },
    { id: 'Other', label: 'Other', icon: 'ellipsis-horizontal', color: '#64748b' }
];

const CrimeReportScreen = ({ navigation }) => {
    const [category, setCategory] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [incidentDate, setIncidentDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [location, setLocation] = useState(null);
    const [address, setAddress] = useState('');
    const [evidenceFiles, setEvidenceFiles] = useState([]);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Don't auto-populate location, let user select on map or use button
        requestLocationPermission();
    }, []);

    const requestLocationPermission = async () => {
        // Just request permissions, don't set location yet
        await Location.requestForegroundPermissionsAsync();
    };

    const handlePickEvidence = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission Required', 'Please grant photo library access');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,
            quality: 0.5,
        });

        if (!result.canceled) {
            setEvidenceFiles([...evidenceFiles, ...result.assets]);
        }
    };

    const removeEvidence = (index) => {
        setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!category || !title || !description || !location) {
            Alert.alert('Missing Fields', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('category', category);
            formData.append('title', title);
            formData.append('description', description);
            formData.append('latitude', location.latitude.toString());
            formData.append('longitude', location.longitude.toString());
            formData.append('address', address);
            formData.append('incidentDate', incidentDate.toISOString());
            formData.append('isAnonymous', isAnonymous.toString());

            evidenceFiles.forEach((file, index) => {
                formData.append('evidence', {
                    uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
                    type: file.type === 'image' ? 'image/jpeg' : 'video/mp4',
                    name: `evidence_${index}.${file.type === 'image' ? 'jpg' : 'mp4'}`,
                });
            });

            const response = await apiClient.post('/crime-reports/submit', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                Alert.alert(
                    'Report Submitted',
                    'Your crime report has been submitted successfully. Thank you for helping make your community safer.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            }
        } catch (error) {
            console.error('Submit error:', error);
            Alert.alert('Error', 'Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#020617', '#0f172a']} style={styles.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Report Crime</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Category Selector */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Category *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setCategory(cat.id)}
                                style={[styles.categoryCard, category === cat.id && { borderColor: cat.color, borderWidth: 2 }]}
                            >
                                <Ionicons name={cat.icon} size={24} color={cat.color} />
                                <Text style={styles.categoryLabel}>{cat.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Incident Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Incident Details</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Title *"
                        placeholderTextColor="#64748b"
                        value={title}
                        onChangeText={setTitle}
                    />
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Description * (What happened?)"
                        placeholderTextColor="#64748b"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={6}
                    />

                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color="#38bdf8" />
                        <Text style={styles.dateText}>
                            {incidentDate.toLocaleDateString()} {incidentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={incidentDate}
                            mode="datetime"
                            display="default"
                            onChange={(event, date) => {
                                setShowDatePicker(false);
                                if (date) setIncidentDate(date);
                            }}
                        />
                    )}
                </View>

                {/* Location Picker with Map */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Incident Location *</Text>

                    <View style={styles.mapContainer}>
                        <MapView
                            style={styles.map}
                            region={{
                                latitude: location?.latitude || 23.8103,
                                longitude: location?.longitude || 90.4125,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            }}
                            onPress={(e) => setLocation({
                                latitude: e.nativeEvent.coordinate.latitude,
                                longitude: e.nativeEvent.coordinate.longitude
                            })}
                        >
                            {location && (
                                <Marker
                                    coordinate={{
                                        latitude: location.latitude,
                                        longitude: location.longitude
                                    }}
                                    title="Incident Location"
                                />
                            )}
                        </MapView>
                        {!location && (
                            <View style={styles.mapOverlay}>
                                <Text style={styles.mapHint}>Tap on map to select location</Text>
                            </View>
                        )}
                    </View>

                    {location && (
                        <View style={styles.locationInfo}>
                            <Ionicons name="location" size={20} color="#10b981" />
                            <Text style={styles.locationText}>
                                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.currentLocationButton}
                        onPress={async () => {
                            const loc = await Location.getCurrentPositionAsync({});
                            setLocation({
                                latitude: loc.coords.latitude,
                                longitude: loc.coords.longitude
                            });
                        }}
                    >
                        <Ionicons name="navigate" size={20} color="#38bdf8" />
                        <Text style={styles.currentLocationText}>Use Current Location</Text>
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        placeholder="Address (Optional)"
                        placeholderTextColor="#64748b"
                        value={address}
                        onChangeText={setAddress}
                    />
                </View>

                {/* Evidence */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Evidence (Optional)</Text>
                    <TouchableOpacity style={styles.uploadButton} onPress={handlePickEvidence}>
                        <Ionicons name="cloud-upload-outline" size={24} color="#38bdf8" />
                        <Text style={styles.uploadText}>Add Photo/Video</Text>
                    </TouchableOpacity>

                    {evidenceFiles.length > 0 && (
                        <View style={styles.evidenceGrid}>
                            {evidenceFiles.map((file, index) => (
                                <View key={index} style={styles.evidenceItem}>
                                    <Image source={{ uri: file.uri }} style={styles.evidenceThumbnail} />
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => removeEvidence(index)}
                                    >
                                        <Ionicons name="close-circle" size={24} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Anonymous Option */}
                <TouchableOpacity
                    style={styles.anonymousToggle}
                    onPress={() => setIsAnonymous(!isAnonymous)}
                >
                    <Ionicons
                        name={isAnonymous ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={isAnonymous ? '#10b981' : '#64748b'}
                    />
                    <Text style={styles.anonymousText}>Submit Anonymously</Text>
                </TouchableOpacity>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={loading ? ['#64748b', '#475569'] : ['#ef4444', '#dc2626']}
                        style={styles.submitGradient}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="paper-plane" size={20} color="#fff" />
                                <Text style={styles.submitText}>Submit Report</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#cbd5e1', marginBottom: 12 },
    categoryScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
    categoryCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        alignItems: 'center',
        width: 100,
        borderWidth: 1,
        borderColor: '#334155'
    },
    categoryLabel: { color: '#cbd5e1', fontSize: 12, marginTop: 8, textAlign: 'center' },
    input: {
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 12,
        padding: 14,
        color: '#fff',
        fontSize: 16,
        marginBottom: 12
    },
    textArea: { minHeight: 120, textAlignVertical: 'top' },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 12,
        padding: 14,
        gap: 10
    },
    dateText: { color: '#cbd5e1', fontSize: 16 },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        gap: 8
    },
    locationText: { color: '#10b981', fontSize: 14 },
    mapContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#334155',
        height: 200
    },
    map: {
        width: '100%',
        height: '100%'
    },
    mapOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        pointerEvents: 'none'
    },
    mapHint: {
        color: '#38bdf8',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center'
    },
    currentLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#38bdf8',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        gap: 8
    },
    currentLocationText: { color: '#38bdf8', fontSize: 14, fontWeight: '600' },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e293b',
        borderWidth: 2,
        borderColor: '#38bdf8',
        borderRadius: 12,
        padding: 16,
        borderStyle: 'dashed',
        gap: 10
    },
    uploadText: { color: '#38bdf8', fontSize: 16, fontWeight: '600' },
    evidenceGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 12 },
    evidenceItem: { position: 'relative' },
    evidenceThumbnail: { width: 100, height: 100, borderRadius: 8 },
    removeButton: { position: 'absolute', top: -8, right: -8 },
    anonymousToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        gap: 10
    },
    anonymousText: { color: '#cbd5e1', fontSize: 16 },
    submitButton: { borderRadius: 12, overflow: 'hidden' },
    submitButtonDisabled: { opacity: 0.6 },
    submitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        gap: 10
    },
    submitText: { color: '#fff', fontSize: 18, fontWeight: '700' }
});

export default CrimeReportScreen;
