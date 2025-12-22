import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * DangerStatusBar Component
 * Displays a colored bar at the top indicating current danger level
 * Red = Danger Zone, Yellow = Medium Risk, Green = Safe Zone
 */
const DangerStatusBar = ({ riskLevel, riskScore, currentZone, loading }) => {
    if (loading) {
        return (
            <View style={[styles.container, styles.loading]}>
                <Text style={styles.text}>Analyzing location...</Text>
            </View>
        );
    }

    // Determine color and message based on risk level
    let backgroundColor, textColor, statusIcon, statusText;

    switch (riskLevel) {
        case 'critical':
            backgroundColor = '#dc2626'; // Red
            textColor = '#fff';
            statusIcon = '🚨';
            statusText = 'DANGER ZONE';
            break;
        case 'high':
            backgroundColor = '#ea580c'; // Orange-Red
            textColor = '#fff';
            statusIcon = '⚠️';
            statusText = 'HIGH RISK AREA';
            break;
        case 'medium':
            backgroundColor = '#f59e0b'; // Yellow-Orange
            textColor = '#fff';
            statusIcon = '⚡';
            statusText = 'MEDIUM RISK';
            break;
        case 'low':
            backgroundColor = '#16a34a'; // Green
            textColor = '#fff';
            statusIcon = '✓';
            statusText = 'SAFE ZONE';
            break;
        default:
            backgroundColor = '#6b7280'; // Gray
            textColor = '#fff';
            statusIcon = '?';
            statusText = 'UNKNOWN';
    }

    // Get zone name
    const zoneName = currentZone?.name || 'Unknown Location';

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <View style={styles.content}>
                <View style={styles.topRow}>
                    <Text style={[styles.zoneText, { color: textColor }]}>
                        📍 {zoneName}
                    </Text>
                </View>
                <View style={styles.bottomRow}>
                    <Text style={[styles.icon, { color: textColor }]}>{statusIcon}</Text>
                    <View style={styles.textContainer}>
                        <Text style={[styles.statusText, { color: textColor }]}>{statusText}</Text>
                        <Text style={[styles.scoreText, { color: textColor }]}>
                            Risk Score: {riskScore}/100
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 2,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    content: {
        alignItems: 'center',
    },
    topRow: {
        marginBottom: 6,
    },
    zoneText: {
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.95,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loading: {
        backgroundColor: '#6b7280',
    },
    icon: {
        fontSize: 24,
        marginRight: 12,
    },
    textContainer: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    scoreText: {
        fontSize: 12,
        marginTop: 2,
        opacity: 0.9,
    },
    text: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default DangerStatusBar;
