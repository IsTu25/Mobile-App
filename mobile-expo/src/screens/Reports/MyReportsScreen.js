import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Platform,
    Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/apiClient';

const MyReportsScreen = ({ navigation }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const response = await apiClient.get('/crime-reports/my-reports');
            if (response.data.success) {
                setReports(response.data.data);
            }
        } catch (error) {
            console.error('Fetch reports error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchReports();
    };

    const getCategoryIcon = (category) => {
        const iconMap = {
            'Theft/Robbery': 'cash-outline',
            'Assault': 'alert-circle-outline',
            'Harassment': 'warning-outline',
            'Vandalism': 'hammer-outline',
            'Drug Activity': 'flask-outline',
            'Traffic Violation': 'car-outline',
            'Fraud/Scam': 'card-outline',
            'Domestic Violence': 'home-outline',
            'Other': 'ellipsis-horizontal'
        };
        return iconMap[category] || 'document-text-outline';
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <LinearGradient colors={['#020617', '#0f172a']} style={styles.background} />
                <Text style={styles.loadingText}>Loading reports...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#020617', '#0f172a']} style={styles.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Reports</Text>
                <TouchableOpacity onPress={fetchReports}>
                    <Ionicons name="refresh" size={24} color="#38bdf8" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
            >
                {reports.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={64} color="#475569" />
                        <Text style={styles.emptyText}>No reports yet</Text>
                        <Text style={styles.emptySubtext}>Your submitted crime reports will appear here</Text>
                    </View>
                ) : (
                    reports.map((report) => (
                        <View key={report._id} style={styles.reportCard}>
                            <LinearGradient
                                colors={['#1e293b', '#0f172a']}
                                style={styles.cardGradient}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name={getCategoryIcon(report.category)} size={24} color="#ef4444" />
                                    </View>
                                    <View style={styles.cardHeaderText}>
                                        <Text style={styles.cardTitle}>{report.title}</Text>
                                        <Text style={styles.cardCategory}>{report.category}</Text>
                                    </View>
                                </View>

                                <Text style={styles.cardDescription} numberOfLines={3}>
                                    {report.description}
                                </Text>

                                {/* Location Info */}
                                <View style={styles.locationSection}>
                                    {report.address && (
                                        <View style={styles.addressRow}>
                                            <Ionicons name="location" size={14} color="#64748b" />
                                            <Text style={styles.addressText} numberOfLines={1}>{report.address}</Text>
                                        </View>
                                    )}
                                    {report.location && (
                                        <View style={styles.coordsRow}>
                                            <Ionicons name="navigate" size={12} color="#475569" />
                                            <Text style={styles.coordsText}>
                                                {report.location.coordinates[1].toFixed(4)}, {report.location.coordinates[0].toFixed(4)}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.cardFooter}>
                                    <View style={styles.dateContainer}>
                                        <Ionicons name="calendar-outline" size={14} color="#64748b" />
                                        <Text style={styles.dateText}>
                                            {new Date(report.incidentDate).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>

                                {report.evidenceFiles && report.evidenceFiles.length > 0 && (
                                    <View style={styles.evidenceIndicator}>
                                        <Ionicons name="image-outline" size={14} color="#38bdf8" />
                                        <Text style={styles.evidenceText}>{report.evidenceFiles.length} evidence file(s)</Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    center: { justifyContent: 'center', alignItems: 'center' },
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
    loadingText: { color: '#94a3b8', fontSize: 16 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#cbd5e1', fontSize: 20, fontWeight: '600', marginTop: 16 },
    emptySubtext: { color: '#64748b', fontSize: 14, marginTop: 8 },
    reportCard: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    cardGradient: { padding: 16 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#ef444420',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    cardHeaderText: { flex: 1 },
    cardTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
    cardCategory: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
    cardDescription: { color: '#cbd5e1', fontSize: 14, lineHeight: 20, marginBottom: 12 },
    locationSection: { marginBottom: 12, gap: 6 },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    addressText: { color: '#94a3b8', fontSize: 13, flex: 1 },
    coordsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 2 },
    coordsText: { color: '#64748b', fontSize: 11, fontFamily: 'monospace' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { color: '#64748b', fontSize: 12 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: '700' },
    evidenceIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
    evidenceText: { color: '#38bdf8', fontSize: 12 }
});

export default MyReportsScreen;
