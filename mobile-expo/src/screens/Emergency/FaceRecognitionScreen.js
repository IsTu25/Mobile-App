import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../../api/apiClient';

export default function FaceRecognitionScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [results, setResults] = useState(null);

    if (!permission) {
        // Camera permissions are still loading
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const takePictureAndScan = async () => {
        if (cameraRef.current && !scanning) {
            setScanning(true);
            setResults(null); // Clear previous results
            try {
                const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });

                // Upload
                const formData = new FormData();
                formData.append('image', {
                    uri: photo.uri,
                    type: 'image/jpeg',
                    name: 'scan.jpg',
                });

                // Using the shared api client
                const response = await api.post('/recognition/image', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (response.data.success) {
                    setResults(response.data.data);
                } else {
                    Alert.alert('Scan Failed', response.data.message);
                }

            } catch (error) {
                console.error(error);
                Alert.alert('Error', 'Failed to scan: ' + (error.response?.data?.message || error.message));
            } finally {
                setScanning(false);
            }
        }
    };

    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} ref={cameraRef}>
                <View style={styles.overlay}>
                    {/* Top Bar with specific "Scan" title */}
                    <View style={styles.topBar}>
                        <Text style={styles.topBarTitle}>Face Recognition</Text>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Results Overlay */}
                    {results && (
                        <View style={styles.resultsContainer}>
                            <Text style={styles.resultHeader}>Scan Results:</Text>
                            {results.recognized.map((p, i) => (
                                <View key={'r' + i} style={styles.matchItem}>
                                    <Text style={styles.matchName}>✅ {p.name}</Text>
                                    <Text style={styles.matchConfidence}>{Math.round(p.confidence * 100)}% Match</Text>
                                </View>
                            ))}
                            {results.unknown.map((u, i) => (
                                <View key={'u' + i} style={styles.unknownItem}>
                                    <Text style={styles.unknownText}>❓ Unknown Person Detected</Text>
                                    <Text style={styles.unknownSubtext}>No record in database</Text>
                                </View>
                            ))}
                            {results.totalFaces === 0 && (
                                <Text style={styles.noFace}>No faces detected in this frame.</Text>
                            )}
                        </View>
                    )}

                    {/* Bottom Controls */}
                    <View style={styles.bottomControls}>
                        <TouchableOpacity style={styles.scanButton} onPress={takePictureAndScan} disabled={scanning}>
                            {scanning ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.scanButtonText}>Capture & Scan</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
        color: '#fff',
        fontSize: 18,
        marginTop: 100,
    },
    permissionButton: {
        backgroundColor: '#e63946',
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 50,
        alignItems: 'center',
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'space-between',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingBottom: 15,
    },
    topBarTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 10,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    resultsContainer: {
        margin: 20,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 15,
        borderRadius: 15,
    },
    resultHeader: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 10,
        fontWeight: 'bold',
        borderBottomWidth: 1,
        borderBottomColor: '#555',
        paddingBottom: 5,
    },
    matchItem: {
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    matchName: {
        color: '#4ade80', // Green
        fontSize: 18,
        fontWeight: 'bold',
    },
    matchConfidence: {
        color: '#aaa',
        fontSize: 14,
    },
    unknownItem: {
        marginBottom: 8,
    },
    unknownText: {
        color: '#fbbf24', // Amber
        fontSize: 16,
        fontWeight: 'bold',
    },
    unknownSubtext: {
        color: '#ccc',
        fontSize: 12,
    },
    noFace: {
        color: '#fff',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    bottomControls: {
        padding: 30,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    scanButton: {
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
    },
    scanButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
