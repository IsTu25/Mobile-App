import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const NearestPoliceStationCard = ({ station, loading, onPress }) => {
    if (loading) {
        return (
            <View style={styles.cardContainer}>
                <LinearGradient
                    colors={['#1e293b', '#0f172a']}
                    style={styles.cardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Locating nearest Safe Haven...</Text>
                    </View>
                </LinearGradient>
            </View>
        );
    }

    if (!station) {
        return null; // Don't show if no station found
    }

    const handleCall = () => {
        if (station.phone) {
            Linking.openURL(`tel:${station.phone}`);
        }
    };

    const handleDirections = () => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${station.latitude},${station.longitude}`;
        const label = station.name;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        Linking.openURL(url);
    };

    return (
        <View style={styles.cardContainer}>
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerRow}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="shield-checkmark" size={24} color="#60a5fa" />
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.label}>NEAREST SAFE HAVEN</Text>
                        <Text style={styles.stationName} numberOfLines={1}>
                            {station.name}
                        </Text>
                    </View>
                    <View style={styles.distanceBadge}>
                        <Text style={styles.distanceText}>{station.distanceKm} km</Text>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                        <Ionicons name="call" size={16} color="#60a5fa" />
                        <Text style={styles.actionText}>CALL</Text>
                    </TouchableOpacity>

                    <View style={styles.verticalDivider} />

                    <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
                        <Ionicons name="navigate" size={16} color="#60a5fa" />
                        <Text style={styles.actionText}>NAVIGATE</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        borderWidth: 1,
        borderColor: 'rgba(96, 165, 250, 0.2)', // Light Blue border
    },
    cardGradient: {
        padding: 16,
    },
    loadingContainer: {
        padding: 12,
        alignItems: 'center',
    },
    loadingText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(96, 165, 250, 0.3)',
    },
    titleContainer: {
        flex: 1,
    },
    label: {
        color: '#60a5fa',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 2,
    },
    stationName: {
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    distanceBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    distanceText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '700',
    },
    actionRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: 'rgba(148, 163, 184, 0.1)',
        paddingTop: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    verticalDivider: {
        width: 1,
        height: '100%',
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
    },
    actionText: {
        color: '#60a5fa',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
});

export default NearestPoliceStationCard;
