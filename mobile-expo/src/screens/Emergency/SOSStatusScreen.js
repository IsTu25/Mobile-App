import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { emergencyAPI } from '../../api/emergencyAPI';
import { LinearGradient } from 'expo-linear-gradient';

const SOSStatusScreen = ({ route, navigation }) => {
    const { alertId } = route.params;
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await emergencyAPI.getSOSAlert(alertId);
                setAlert(response.data);
            } catch (error) {
                console.error('Failed to fetch SOS alert status:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [alertId]);

    const handleCancel = async () => {
        Alert.alert(
            'Cancel SOS',
            'Are you sure you want to cancel this SOS alert? Only do this if you are safe.',
            [
                { text: 'No, I need help', style: 'cancel' },
                {
                    text: 'Yes, I am safe',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await emergencyAPI.cancelSOS(alertId);
                            navigation.navigate('Home');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to cancel SOS alert.');
                        }
                    },
                },
            ]
        );
    };

    if (loading && !alert) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#e63946" />
                <Text style={styles.loadingText}>Fetching SOS Status...</Text>
            </View>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#ef4444';
            case 'responded': return '#3b82f6';
            case 'resolved': return '#10b981';
            case 'cancelled': return '#6b7280';
            default: return '#6b7280';
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.header}
            >
                <Ionicons name="warning" size={60} color="#ef4444" />
                <Text style={styles.title}>SOS ALERT ACTIVE</Text>
                <Text style={styles.subtitle}>ID: {alertId}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(alert?.status) }]}>
                    <Text style={styles.statusText}>{alert?.status?.toUpperCase() || 'LOADING...'}</Text>
                </View>
            </LinearGradient>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status Timeline</Text>
                <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, styles.dotActive]} />
                    <View style={styles.timelineContent}>
                        <Text style={styles.timelineLabel}>SOS Triggered</Text>
                        <Text style={styles.timelineTime}>{alert?.createdAt ? new Date(alert.createdAt).toLocaleTimeString() : '...'}</Text>
                    </View>
                </View>

                {alert?.notifiedPoliceStations?.map((station, index) => (
                    <View style={styles.timelineItem} key={`station-${index}`}>
                        <View style={[styles.timelineDot, styles.dotNotified]} />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineLabel}>Notified: {station.stationName}</Text>
                            <Text style={styles.timelineTime}>{station.notifiedAt ? new Date(station.notifiedAt).toLocaleTimeString() : '...'}</Text>
                        </View>
                    </View>
                ))}

                {alert?.status === 'responded' && (
                    <View style={styles.timelineItem}>
                        <View style={[styles.timelineDot, { backgroundColor: '#3b82f6' }]} />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineLabel}>Police Responded</Text>
                            <Text style={styles.timelineTime}>{alert?.updatedAt ? new Date(alert.updatedAt).toLocaleTimeString() : '...'}</Text>
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancel}
                >
                    <Text style={styles.cancelButtonText}>CANCEL SOS (I'M SAFE)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Text style={styles.backButtonText}>BACK TO DASHBOARD</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    content: {
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#020617',
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
    },
    header: {
        padding: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 10,
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: 14,
        marginTop: 5,
    },
    statusBadge: {
        paddingHorizontal: 20,
        paddingVertical: 5,
        borderRadius: 20,
        marginTop: 15,
    },
    statusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    section: {
        padding: 20,
        marginTop: 10,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 4,
        marginRight: 15,
    },
    dotActive: {
        backgroundColor: '#ef4444',
    },
    dotNotified: {
        backgroundColor: '#f59e0b',
    },
    timelineContent: {
        flex: 1,
    },
    timelineLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    timelineTime: {
        color: '#94a3b8',
        fontSize: 12,
        marginTop: 2,
    },
    buttonContainer: {
        padding: 20,
        gap: 15,
    },
    cancelButton: {
        backgroundColor: '#ef4444',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    backButton: {
        backgroundColor: '#1e293b',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default SOSStatusScreen;
