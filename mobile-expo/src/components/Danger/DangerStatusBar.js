import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * DangerStatusBar Component
 * Displays a colored gradient bar at the top indicating current danger level
 * Professional Dark Mode Theme
 */
const DangerStatusBar = ({ riskLevel, riskScore, currentZone, loading }) => {
    if (loading) {
        return (
            <LinearGradient colors={['#334155', '#1e293b']} style={styles.container}>
                <Text style={styles.text}>SCANNING AREA...</Text>
            </LinearGradient>
        );
    }

    // Determine colors and message based on risk level
    let gradientColors, textColor, statusIcon, statusText, borderColor;

    switch (riskLevel) {
        case 'critical':
            gradientColors = ['#7f1d1d', '#991b1b']; // Dark Red
            borderColor = '#ef4444';
            textColor = '#fef2f2';
            statusIcon = '🚨';
            statusText = 'CRITICAL DANGER';
            break;
        case 'high':
            gradientColors = ['#9a3412', '#c2410c']; // Dark Orange
            borderColor = '#f97316';
            textColor = '#fff7ed';
            statusIcon = '⚠️';
            statusText = 'HIGH RISK';
            break;
        case 'medium':
            gradientColors = ['#92400e', '#b45309']; // Dark Amber
            borderColor = '#fbbf24';
            textColor = '#fffbeb';
            statusIcon = '⚡';
            statusText = 'MODERATE';
            break;
        case 'low':
            gradientColors = ['#14532d', '#15803d']; // Dark Green
            borderColor = '#4ade80';
            textColor = '#f0fdf4';
            statusIcon = '🛡️';
            statusText = 'SECURE ZONE';
            break;
        default:
            gradientColors = ['#334155', '#475569']; // Slate
            borderColor = '#94a3b8';
            textColor = '#f8fafc';
            statusIcon = '•';
            statusText = 'UNKNOWN';
    }

    // Get zone name
    const zoneName = currentZone?.name || 'Unknown Sector';

    return (
        <LinearGradient
            colors={gradientColors}
            style={[styles.container, { borderColor: borderColor }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
        >
            <View style={styles.content}>
                <View style={styles.topRow}>
                    <Text style={[styles.zoneText, { color: textColor }]}>
                        📍 {zoneName.toUpperCase()}
                    </Text>
                </View>
                <View style={styles.bottomRow}>
                    <Text style={[styles.icon]}>{statusIcon}</Text>
                    <View style={styles.textContainer}>
                        <Text style={[styles.statusText, { color: textColor }]}>{statusText}</Text>
                        <Text style={[styles.scoreText, { color: textColor }]}>
                            RISK INDEX: {riskScore}/100
                        </Text>
                    </View>
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginTop: 10,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    content: {
        alignItems: 'center',
    },
    topRow: {
        marginBottom: 8,
    },
    zoneText: {
        fontSize: 11,
        fontWeight: '700',
        opacity: 0.9,
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        overflow: 'hidden',
        letterSpacing: 1,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 24,
        marginRight: 12,
        color: '#fff'
    },
    textContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    statusText: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1,
    },
    scoreText: {
        fontSize: 10,
        marginTop: 2,
        opacity: 0.9,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    text: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        padding: 5,
        letterSpacing: 1,
    },
});

export default DangerStatusBar;
