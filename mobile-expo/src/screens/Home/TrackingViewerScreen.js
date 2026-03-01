import React from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    Share,
    Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const TrackingViewerScreen = ({ route, navigation }) => {
    const { sessionId, trackingUrl } = route.params;

    const handleShare = async () => {
        try {
            await Share.share({
                message: `I am sharing my live location via Nirapotta. Follow me here: ${trackingUrl}`,
            });
        } catch (error) {
            console.error('Share failed:', error);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Live Tracking View</Text>
                <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                    <Ionicons name="share-social" size={24} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            <View style={styles.webviewContainer}>
                <WebView
                    source={{ uri: trackingUrl }}
                    style={styles.webview}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loading}>
                            <Text style={{ color: '#fff' }}>Loading Map...</Text>
                        </View>
                    )}
                />
            </View>

            <View style={styles.footer}>
                <View style={styles.statusIndicator}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>LIVE BROADCAST ACTIVE</Text>
                </View>
                <Text style={styles.footerNote}>Anyone with this link can see your location.</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    webviewContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    webview: {
        flex: 1,
    },
    loading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#020617',
    },
    footer: {
        padding: 20,
        backgroundColor: '#0f172a',
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 5,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ef4444',
        marginRight: 8,
    },
    statusText: {
        color: '#ef4444',
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 1,
    },
    footerNote: {
        color: '#94a3b8',
        fontSize: 11,
        textAlign: 'center',
    },
    backButton: {
        padding: 5,
    },
    shareButton: {
        padding: 5,
    },
});

export default TrackingViewerScreen;
