import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * NearestDangerAlert Component
 * Displays information about the nearest danger zone to help users avoid it
 * Only shows if it's a DIFFERENT area than where you currently are
 */
const NearestDangerAlert = ({ nearestHotspot, currentZone, onViewDetails }) => {
    // Don't show if no hotspot data
    if (!nearestHotspot) {
        return (
            <View style={styles.container}>
                <View style={styles.safeCard}>
                    <Text style={styles.safeIcon}>✓</Text>
                    <Text style={styles.safeTitle}>No Danger Zones Nearby</Text>
                    <Text style={styles.safeSubtitle}>You're in a safe area</Text>
                </View>
            </View>
        );
    }

    // Don't show if the nearest danger zone is the SAME as your current location
    // (This prevents showing "Uttara" twice with different risk scores)
    if (currentZone && nearestHotspot.name === currentZone.name && nearestHotspot.distance < 5000) {
        return (
            <View style={styles.container}>
                <View style={styles.safeCard}>
                    <Text style={styles.safeIcon}>ℹ️</Text>
                    <Text style={styles.safeTitle}>You are in {currentZone.name}</Text>
                    <Text style={styles.safeSubtitle}>Check the top bar for current risk level</Text>
                </View>
            </View>
        );
    }

    const { name, distance, riskLevel } = nearestHotspot;
    const distanceKm = (distance / 1000).toFixed(2);

    // Handle distance display
    let distanceText;
    if (distance < 100) {
        distanceText = 'You are here';
    } else if (distance < 1000) {
        distanceText = `${Math.round(distance)}m away`;
    } else {
        distanceText = `${distanceKm}km away`;
    }

    // Determine alert level based on distance and risk
    let alertStyle, alertIcon, alertTitle;
    if (distance < 100) {
        // User is AT the danger zone
        alertStyle = styles.criticalAlert;
        alertIcon = '🚨';
        alertTitle = 'YOU ARE IN A DANGER ZONE';
    } else if (distance < 500) {
        alertStyle = styles.criticalAlert;
        alertIcon = '🚨';
        alertTitle = 'DANGER ZONE NEARBY';
    } else if (distance < 1000) {
        alertStyle = styles.warningAlert;
        alertIcon = '⚠️';
        alertTitle = 'Warning: Danger Zone Ahead';
    } else {
        alertStyle = styles.infoAlert;
        alertIcon = 'ℹ️';
        alertTitle = 'Danger Zone in Area';
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.card, alertStyle]}
                onPress={onViewDetails}
                activeOpacity={0.8}
            >
                <View style={styles.header}>
                    <Text style={styles.icon}>{alertIcon}</Text>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>{alertTitle}</Text>
                        <Text style={styles.subtitle}>Tap for details</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.details}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Location:</Text>
                        <Text style={styles.detailValue}>{name}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Distance:</Text>
                        <Text style={styles.detailValue}>{distanceText}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Risk Level:</Text>
                        <View style={styles.riskBadge}>
                            <Text style={styles.riskBadgeText}>{riskLevel}/100</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.recommendation}>
                    <Text style={styles.recommendationIcon}>💡</Text>
                    <Text style={styles.recommendationText}>
                        {distance < 100
                            ? 'Leave this area immediately and move to a safer location'
                            : distance < 500
                                ? 'Consider leaving this area immediately'
                                : distance < 1000
                                    ? 'Avoid moving towards this area'
                                    : 'Be cautious if traveling in this direction'}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderLeftWidth: 4,
    },
    criticalAlert: {
        borderLeftColor: '#dc2626',
        backgroundColor: '#fef2f2',
    },
    warningAlert: {
        borderLeftColor: '#f59e0b',
        backgroundColor: '#fffbeb',
    },
    infoAlert: {
        borderLeftColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    safeCard: {
        backgroundColor: '#f0fdf4',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#16a34a',
    },
    safeIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    safeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#16a34a',
        marginBottom: 4,
    },
    safeSubtitle: {
        fontSize: 14,
        color: '#15803d',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    icon: {
        fontSize: 32,
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12,
        color: '#6b7280',
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 12,
    },
    details: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#1f2937',
        fontWeight: '600',
    },
    riskBadge: {
        backgroundColor: '#dc2626',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    riskBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    recommendation: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    recommendationIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    recommendationText: {
        flex: 1,
        fontSize: 13,
        color: '#1e40af',
        lineHeight: 18,
    },
});

export default NearestDangerAlert;
