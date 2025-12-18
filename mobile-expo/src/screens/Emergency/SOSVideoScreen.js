import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Linking,
    ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { emergencyAPI } from '../../api/emergencyAPI';
import * as Location from 'expo-location';
import { useDispatch } from 'react-redux';
import { clearActiveAlert } from '../../store/slices/emergencySlice';

const SOSVideoScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const [permission, requestPermission] = useCameraPermissions();
    const [micPermission, requestMicPermission] = useMicrophonePermissions();
    const [isRecording, setIsRecording] = useState(false);
    const [timeLeft, setTimeLeft] = useState(10);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const cameraRef = useRef(null);

    // Specific Police Number mentioned by User
    const POLICE_NUMBER = '01837121760';

    useEffect(() => {
        startRecordingFlow();
    }, []);

    useEffect(() => {
        let timer;
        if (isRecording && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isRecording) {
            stopRecording();
        }
        return () => clearInterval(timer);
    }, [isRecording, timeLeft]);

    const startRecordingFlow = async () => {
        // Check permissions
        if (!permission || !permission.granted) {
            const { granted } = await requestPermission();
            if (!granted) {
                Alert.alert('Permission needed', 'Camera permission is required for SOS evidence.');
                return;
            }
        }

        if (!micPermission || !micPermission.granted) {
            const { granted } = await requestMicPermission();
            if (!granted) {
                Alert.alert('Permission needed', 'Microphone permission is required for audio evidence.');
                return;
            }
        }

        // Start recording immediately
        setTimeout(() => {
            if (cameraRef.current) {
                setIsRecording(true);
                cameraRef.current.recordAsync({
                    maxDuration: 10,
                    quality: '480p', // Lower quality for faster upload
                }).then((data) => {
                    handleVideoRecorded(data.uri);
                }).catch(err => {
                    console.error(err);
                    setIsRecording(false);
                });
            }
        }, 1000); // Small delay to ensure camera is ready
    };

    const stopRecording = () => {
        if (cameraRef.current && isRecording) {
            cameraRef.current.stopRecording();
            setIsRecording(false);
        }
    };

    const handleVideoRecorded = async (uri) => {
        setUploading(true);
        try {
            // Get location
            const { coords } = await Location.getCurrentPositionAsync({});

            // Upload with progress tracking
            await emergencyAPI.uploadVideo(uri, {
                latitude: coords.latitude,
                longitude: coords.longitude
            }, (progress) => {
                setUploadProgress(progress);
            });

            Alert.alert('Evidence Sent', 'Video evidence has been emailed to the nearest police station.');
            dispatch(clearActiveAlert());
            navigation.goBack();
        } catch (error) {
            console.error('Upload failed:', error);
            Alert.alert('Error', 'Failed to upload video evidence.');
            dispatch(clearActiveAlert());
            navigation.goBack();
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleCallPolice = () => {
        Linking.openURL(`tel:${POLICE_NUMBER}`);
    };

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text>No access to camera</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                ref={cameraRef}
                mode="video"
            />
            {/* Overlay moved outside CameraView to fix warning */}
            <View style={[styles.overlay, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}>
                {/* Top Status */}
                <View style={styles.statusContainer}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingText}>REC | {timeLeft}s</Text>
                </View>

                {/* Center Info */}
                <View style={styles.centerInfo}>
                    <Text style={styles.alertText}>
                        {uploading ? `UPLOADING EVIDENCE: ${Math.round(uploadProgress * 100)}%` : 'UPLOADING EVIDENCE TO POLICE'}
                    </Text>
                    {uploading && (
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBarFull, { width: `${uploadProgress * 100}%` }]} />
                        </View>
                    )}
                    {uploading && <ActivityIndicator size="large" color="#fff" style={{ marginTop: 10 }} />}
                </View>

                {/* Bottom Actions */}
                <View style={styles.bottomActions}>
                    <TouchableOpacity
                        style={styles.callButton}
                        onPress={handleCallPolice}
                    >
                        <Text style={styles.callButtonText}>📞 CALL POLICE NOW</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: 'rgba(255, 0, 0, 0.6)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    recordingDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#fff',
        marginRight: 8,
    },
    recordingText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    centerInfo: {
        alignItems: 'center',
    },
    alertText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginTop: 20,
        letterSpacing: 1,
        textAlign: 'center'
    },
    progressContainer: {
        width: '80%',
        height: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 5,
        marginTop: 15,
        overflow: 'hidden',
    },
    progressBarFull: {
        height: '100%',
        backgroundColor: '#4ade80', // Green progress bar
    },
    bottomActions: {
        width: '100%',
        alignItems: 'center',
    },
    callButton: {
        backgroundColor: '#e63946',
        width: '100%',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    callButtonText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
});

export default SOSVideoScreen;
