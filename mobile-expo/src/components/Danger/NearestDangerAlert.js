import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * NearestDangerAlert Component
 * Dark Mode: Slate background with neon stroke.
 */
const NearestDangerAlert = ({ nearestHotspot, currentZone, onViewDetails }) => {
    if (!nearestHotspot) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#1e293b', '#0f172a']}
                    style={[styles.card, styles.safeCard]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="shield-checkmark" size={28} color="#4ade80" />
                    <View style={styles.textContainer}>
                        <Text style={styles.cardTitle}>AREA SECURE</Text>
                        <Text style={styles.cardSubtitle}>No immediate threats detected.</Text>
                    </View>
                </LinearGradient>
            </View>
        );
    }

    if (currentZone && nearestHotspot.name === currentZone.name && nearestHotspot.distance < 5000) {
        return null;
    }

    const { name, distance } = nearestHotspot;
    const distanceText = distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`;

    let borderColor, iconName, iconColor, title, bgTint;

    if (distance < 100 || distance < 500) {
        borderColor = '#ef4444'; // Red
        iconName = 'alert-circle';
        iconColor = '#ef4444';
        title = 'PROXIMITY WARNING';
        bgTint = 'rgba(239, 68, 68, 0.1)';
    } else if (distance < 1000) {
        borderColor = '#f59e0b'; // Amber
        iconName = 'warning';
        iconColor = '#f59e0b';
        title = 'CAUTION ADVISED';
        bgTint = 'rgba(245, 158, 11, 0.1)';
    } else {
        borderColor = '#3b82f6'; // Blue
        iconName = 'information-circle';
        iconColor = '#3b82f6';
        title = 'SYSTEM NOTICE';
        bgTint = 'rgba(59, 130, 246, 0.1)';
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={onViewDetails}
                activeOpacity={0.7}
            >
                <LinearGradient
                    colors={['#1e293b', '#0f172a']}
                    style={[styles.card, { borderLeftColor: borderColor }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.header}>
                        <View style={[styles.iconBox, { backgroundColor: bgTint }]}>
                            <Ionicons name={iconName} size={24} color={iconColor} />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={[styles.title, { color: iconColor }]}>{title}</Text>
                            <Text style={styles.subtitle}>
                                {name} detected {distanceText} away.
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#475569" />
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: iconColor }]}>VIEW TACTICAL ANALYSIS</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingVertical: 8,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 3,
        borderWidth: 1,
        borderColor: '#334155',
    },
    safeCard: {
        borderLeftColor: '#4ade80',
        flexDirection: 'row',
        alignItems: 'center',
    },
    textContainer: {
        marginLeft: 16,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#f0fdf4',
        letterSpacing: 1,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#cbd5e1',
    },
    footer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    footerText: {
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'right',
        letterSpacing: 1,
    }
});

export default NearestDangerAlert;
