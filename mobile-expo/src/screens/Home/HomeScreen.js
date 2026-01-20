import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Share,
  Linking
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import SOSButton from '../../components/SOS/SOSButton';
import DangerStatusBar from '../../components/Danger/DangerStatusBar';
import NearestDangerAlert from '../../components/Danger/NearestDangerAlert';
import { emergencyAPI } from '../../api/emergencyAPI';
import { dangerAPI } from '../../api/dangerAPI';
import { setActiveAlert } from '../../store/slices/emergencySlice';
import { logout } from '../../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../api/authAPI';
import apiClient from '../../api/apiClient';

import VoiceTriggerService from '../../services/VoiceTriggerService';
import GutFeelingService from '../../services/GutFeelingService';
import TrackingService from '../../services/TrackingService';
import AudioAnalysisService from '../../services/AudioAnalysisService';
import PoliceStationService from '../../services/PoliceStationService';
import NearestPoliceStationCard from '../../components/Police/NearestPoliceStationCard';

const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [dangerLoading, setDangerLoading] = useState(false);
  const [riskData, setRiskData] = useState(null);
  const [gutFeelingScore, setGutFeelingScore] = useState(0); // 0-1
  const [policeStation, setPoliceStation] = useState(null);
  const [policeLoading, setPoliceLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isAudioProtectionActive, setIsAudioProtectionActive] = useState(false);
  const [triggerPhrase, setTriggerPhrase] = useState('help');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState(null);

  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { isSOSActive } = useSelector(state => state.emergency);

  // Animated values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const radarAnim = useRef(new Animated.Value(0)).current;

  // Initialize Services
  useEffect(() => {
    // 1. Voice
    VoiceTriggerService.setCallbacks(
      () => {
        Alert.alert('VOICE TRIGGER DETECTED', `Phrase "${triggerPhrase}" heard. Activating SOS...`);
        handleSOSTrigger();
      },
      (e) => { }
    );

    // 2. Digital Gut Feeling (Start Monitoring)
    GutFeelingService.startMonitoring();
    GutFeelingService.setCallback((score) => {
      // Smoothly update visual score
      setGutFeelingScore(prev => (prev * 0.7) + (score * 0.3));

      // Auto-Trigger if VERY high risk (e.g. > 0.95)
      if (score > 0.95) {
        Alert.alert("DANGER DETECTED", "High stress patterns detected. Are you safe?", [
          { text: "I'm Safe", style: "cancel" },
          { text: "SOS", style: "destructive", onPress: () => handleSOSTrigger() }
        ]);
      }
    });

    // 3. Check Tracking Status
    (async () => {
      const active = await TrackingService.isActive();
      setIsTracking(active);
    })();

    // Cleanup
    return () => {
      VoiceTriggerService.stopListening();
      GutFeelingService.stopMonitoring();
      AudioAnalysisService.stopMonitoring();
    };
  }, [triggerPhrase, location]);

  const toggleVoiceMode = async () => {
    if (isVoiceActive) {
      await VoiceTriggerService.stopListening();
      setIsVoiceActive(false);
      Alert.alert('Voice Guard', 'System Deactivated.');
    } else {
      Alert.alert(
        'Activate Voice Guard?',
        `System will listen for the phrase: "${triggerPhrase}".\n\n(Note: Requires background permission for full functionality)`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Activate',
            onPress: async () => {
              await VoiceTriggerService.startListening();
              setIsVoiceActive(true);
            }
          }
        ]
      );
    }
  };

  const changeTriggerPhrase = () => {
    Alert.prompt(
      'Set Trigger Phrase',
      'Enter a word or short phrase to trigger SOS automatically.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (text) => {
            if (text && text.length > 0) {
              setTriggerPhrase(text);
              VoiceTriggerService.setTriggerWord(text);
              Alert.alert('Success', `Trigger phrase updated to: "${text}"`);
              // Restart if active
              if (isVoiceActive) {
                VoiceTriggerService.stopListening().then(() => VoiceTriggerService.startListening());
              }
            }
          }
        }
      ],
      'plain-text',
      triggerPhrase
    );
  };

  const toggleAudioProtection = async () => {
    if (isAudioProtectionActive) {
      await AudioAnalysisService.stopMonitoring();
      setIsAudioProtectionActive(false);
      Alert.alert('Audio Protection', 'Deactivated.');
    } else {
      Alert.alert(
        'Activate Audio Protection?',
        'System will continuously analyze background audio for danger sounds (screams, gunshots, etc.).\n\nNote: May consume battery.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Activate',
            onPress: async () => {
              const result = await AudioAnalysisService.startMonitoring((dangerEvent) => {
                // Danger detected callback
                console.log('[HomeScreen] Danger Event:', dangerEvent);

                // Automatic SOS if confidence is high (>= 80%)
                if (dangerEvent.confidence >= 0.8) {
                  Alert.alert(
                    '⚠️ CRITICAL DANGER DETECTED',
                    `Detected: ${dangerEvent.soundClass} (${(dangerEvent.confidence * 100).toFixed(1)}%)\nTriggering SOS Automatically...`
                  );
                  handleSOSTrigger();
                } else {
                  // Ask user for lower confidence detections
                  Alert.alert(
                    '⚠️ DANGER SOUND DETECTED',
                    `Detected: ${dangerEvent.soundClass}\nConfidence: ${(dangerEvent.confidence * 100).toFixed(1)}%\n\nTrigger SOS?`,
                    [
                      { text: 'False Alarm', style: 'cancel' },
                      { text: 'SOS', style: 'destructive', onPress: () => handleSOSTrigger() }
                    ]
                  );
                }
              });

              if (result.success) {
                setIsAudioProtectionActive(true);
              } else {
                Alert.alert('Error', result.error || 'Failed to start audio monitoring');
              }
            }
          }
        ]
      );
    }
  };

  // Fetch location and danger prediction
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to use SOS.');
        return;
      }

      let locationResult = await Location.getCurrentPositionAsync({});
      const currentLocation = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
      };
      setLocation(currentLocation);

      // Fetch danger prediction for current location
      fetchDangerPrediction(currentLocation.latitude, currentLocation.longitude);
      fetchNearestPoliceStation(currentLocation.latitude, currentLocation.longitude);
    })();

    // Breathing pulse animation for button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Radar 'ping' animation
    Animated.loop(
      Animated.timing(radarAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();

    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

  }, []);

  const fetchDangerPrediction = async (latitude, longitude) => {
    setDangerLoading(true);
    try {
      const response = await dangerAPI.getRiskScore(latitude, longitude);
      setRiskData(response.data);
    } catch (error) {
      // Graceful error handling
      setRiskData({
        riskScore: 0,
        riskLevel: 'low',
        location: {
          latitude,
          longitude,
          nearestHotspot: null
        },
        factors: [],
        nearbyIncidents: []
      });
    } finally {
      setDangerLoading(false);
    }
  };


  // --- NEW: Live Location Logic ---
  const handleStartLiveLocation = async () => {
    setLoading(true);
    try {
      const { trackingUrl: url } = await TrackingService.startSharing();
      setTrackingUrl(url);
      setIsTracking(true);

      Alert.alert(
        'Live Location Active',
        'Your location is now being shared in real-time.',
        [
          { text: 'OK' },
          { text: 'Notify Contacts (SMS)', onPress: () => notifyContacts(url) },
          { text: 'Share Link (Manual)', onPress: () => shareTrackingLink(url) }
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to start live location. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleStopLiveLocation = async () => {
    await TrackingService.stopSharing();
    setIsTracking(false);
    setTrackingUrl(null);
    Alert.alert('Live Location', 'Sharing stopped.');
  };

  const shareTrackingLink = async (url) => {
    if (!url) return;
    try {
      let message = `Follow my live location here: ${url}`;
      if (location) {
        message += `\nLoc: ${location.latitude},${location.longitude}`;
      }
      await Share.share({
        message: message,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const fetchNearestPoliceStation = async (latitude, longitude) => {
    setPoliceLoading(true);
    try {
      const station = await PoliceStationService.getNearestStation(latitude, longitude);
      setPoliceStation(station);
    } catch (error) {
      console.log('Failed to fetch police station');
    } finally {
      setPoliceLoading(false);
    }
  };

  const handleSOSTrigger = async () => {
    if (!location) {
      Alert.alert('System Alert', 'Acquiring GPS coordinates. Please wait.');
      return;
    }

    // 1. Start Tracking Automatically
    let url = null;
    try {
      const result = await TrackingService.startSharing();
      url = result.trackingUrl;
      setTrackingUrl(url);
      setIsTracking(true);
    } catch (e) {
      console.log('Failed to auto-start tracking during SOS:', e);
    }

    triggerSOSAlert(url);
  };

  const triggerSOSAlert = async (trackUrl) => {
    setLoading(true);
    try {
      const result = await emergencyAPI.triggerSOS(
        {
          type: 'Point',
          coordinates: [location.longitude, location.latitude],
          trackingUrl: trackUrl
        },
        'button'
      );
      navigation.navigate('SOSVideo');
      dispatch(setActiveAlert(result.data.alert));

      // 3. Open WhatsApp for "Nearest Police"
      if (trackUrl) {
        setTimeout(() => {
          Alert.alert(
            'SOS Broadcasted',
            'Share your live location via WhatsApp?',
            [
              { text: 'No', style: 'cancel' },
              {
                text: 'Open WhatsApp',
                onPress: () => {
                  const locStr = location ? ` Loc: ${location.latitude},${location.longitude}` : '';
                  Linking.openURL(`whatsapp://send?text=HELP! I need help. Follow my live location here: ${trackUrl}${locStr}`);
                }
              }
            ]
          );
        }, 1000);
      }

    } catch (error) {
      const message = error.response?.data?.message || 'Failed to trigger SOS';
      Alert.alert('Connection Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Terminate Session',
      'Confirm disconnection from secure server?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try { await authAPI.logout(); } catch (e) { }
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
            await AsyncStorage.removeItem('user');
            dispatch(logout());
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        }
      ]
    );
  };

  const handleViewDangerDetails = () => {
    if (!riskData) return;
    const { location: riskLocation, riskScore, riskLevel, factors, nearbyIncidents } = riskData;
    const { nearestHotspot } = riskLocation;

    let detailsMessage = `Location: ${nearestHotspot?.name || 'Unknown'}\n`;
    detailsMessage += `Risk Score: ${riskScore}/100 (${riskLevel})\n\n`;

    if (factors && factors.length > 0) {
      detailsMessage += 'Risk Factors:\n';
      factors.forEach(factor => {
        detailsMessage += `• ${factor.description}\n`;
      });
    }

    if (nearbyIncidents && nearbyIncidents.length > 0) {
      detailsMessage += `\nRecent Incidents: ${nearbyIncidents.length} reported nearby`;
    }

    Alert.alert('Security Analysis', detailsMessage, [{ text: 'Dismiss', style: 'cancel' }]);
  };

  const QuickActionCard = ({ title, icon, color, onPress }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.6}>
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.actionCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.actionIconContainer, { borderColor: color }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
        <Ionicons name="chevron-forward" size={18} color="#64748b" />
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Deep Dark Background */}
      <LinearGradient
        colors={['#020617', '#0f172a', '#1e293b']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Header / Welcome Area */}
          <View style={styles.headerSection}>
            <View>
              <Text style={styles.greetingText}>SYSTEM ONLINE</Text>

              <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.userText}>{user?.fullName?.split(' ')[0]}'s Dashboard</Text>
                  <Ionicons name="chevron-forward-circle" size={24} color="#38bdf8" />
                </View>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Ionicons
                  name="pulse"
                  size={14}
                  color={gutFeelingScore > 0.6 ? "#ef4444" : "#10b981"}
                />
                <Text style={{
                  color: gutFeelingScore > 0.6 ? "#ef4444" : "#64748b",
                  fontSize: 10,
                  fontWeight: "700",
                  marginLeft: 6,
                  letterSpacing: 1
                }}>
                  GUT FEELING: {gutFeelingScore > 0.6 ? "HIGH STRESS" : "CALM"} ({(gutFeelingScore * 100).toFixed(0)}%)
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, location ? styles.statusActive : styles.statusInactive]}>
              <View style={[styles.statusDot, location ? styles.dotActive : styles.dotInactive]} />
              <Text style={styles.statusText}>{location ? 'GPS LOCKED' : 'SEARCHING...'}</Text>
            </View>
          </View>

          {/* Voice Guard Control */}
          <View style={styles.voiceControlContainer}>
            <TouchableOpacity
              style={[styles.voiceBtn, isVoiceActive ? styles.voiceBtnActive : styles.voiceBtnInactive]}
              onPress={toggleVoiceMode}
              onLongPress={changeTriggerPhrase}
            >
              <Ionicons name={isVoiceActive ? "mic" : "mic-off"} size={20} color="#fff" />
              <Text style={styles.voiceBtnText}>
                {isVoiceActive ? `LISTENING: "${triggerPhrase.toUpperCase()}"` : "VOICE GUARD OFF"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Audio Protection Control */}
          <View style={styles.voiceControlContainer}>
            <TouchableOpacity
              style={[styles.voiceBtn, isAudioProtectionActive ? styles.voiceBtnActive : styles.voiceBtnInactive]}
              onPress={toggleAudioProtection}
            >
              <Ionicons name={isAudioProtectionActive ? "volume-high" : "volume-mute"} size={20} color="#fff" />
              <Text style={styles.voiceBtnText}>
                {isAudioProtectionActive ? "AUDIO PROTECTION ON" : "AUDIO PROTECTION OFF"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Danger Status Bar */}
          <View style={styles.statusBarContainer}>
            <DangerStatusBar
              riskLevel={riskData?.riskLevel}
              riskScore={riskData?.riskScore}
              currentZone={riskData?.location?.currentZone}
              loading={dangerLoading}
            />
          </View>

          {/* Nearest Danger Alert */}
          <View style={styles.alertWrapper}>
            <NearestDangerAlert
              nearestHotspot={riskData?.location?.nearestHotspot}
              currentZone={riskData?.location?.currentZone}
              onViewDetails={handleViewDangerDetails}
            />
            {/* Nearest Police Station */}
            <View style={{ marginTop: 20 }}>
              <NearestPoliceStationCard
                station={policeStation}
                loading={policeLoading}
              />
            </View>
          </View>

          {/* SOS Section - Radar Style */}
          <View style={styles.sosSection}>
            <Text style={styles.sosHeader}>EMERGENCY PROTOCOL</Text>

            <View style={styles.radarContainer}>
              {/* Radar Ripple 1 */}
              <Animated.View
                style={[
                  styles.radarRing,
                  {
                    transform: [{ scale: radarAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }],
                    opacity: radarAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] })
                  }
                ]}
              />
              {/* Radar Ripple 2 - Delayed */}
              <Animated.View
                style={[
                  styles.radarRing,
                  {
                    transform: [{ scale: radarAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }],
                    opacity: radarAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.4, 0] })
                  }
                ]}
              />

              <Animated.View style={[styles.sosButtonWrapper, { transform: [{ scale: pulseAnim }] }]}>
                {loading ? (
                  <View style={styles.loadingSOS}>
                    <ActivityIndicator size="large" color="#fff" />
                  </View>
                ) : (
                  <SOSButton onTrigger={handleSOSTrigger} disabled={isSOSActive} />
                )}
              </Animated.View>
            </View>

            {isSOSActive && (
              <View style={styles.activeAlertBanner}>
                <Ionicons name="warning" size={20} color="#fff" />
                <Text style={styles.activeAlertText}>SOS SIGNAL BROADCASTING</Text>
              </View>
            )}

            <Text style={styles.sosInstruction}>PRESS & HOLD TO TRIGGER</Text>
          </View>

          {/* Quick Actions Grid */}
          <View style={styles.actionsContainer}>
            <Text style={styles.sectionHeader}>QUICK ACCESS</Text>

            {/* NEW: Live Location Card */}
            {isTracking ? (
              <TouchableOpacity style={[styles.actionCard, { borderColor: '#ef4444', borderWidth: 1 }]} onPress={handleStopLiveLocation}>
                <LinearGradient
                  colors={['#450a0a', '#7f1d1d']}
                  style={styles.actionCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={[styles.actionIconContainer, { borderColor: '#fff', backgroundColor: '#ef4444' }]}>
                    <Ionicons name="stop" size={22} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionTitle}>Stop Sharing Location</Text>
                    <Text style={{ color: '#fca5a5', fontSize: 10 }}>Status: LIVE</Text>
                  </View>
                  <TouchableOpacity onPress={() => shareTrackingLink(trackingUrl)}>
                    <Ionicons name="share-social" size={24} color="#fff" />
                  </TouchableOpacity>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <QuickActionCard
                title="Share Live Location"
                icon="navigate-circle"
                color="#f472b6"
                onPress={handleStartLiveLocation}
              />
            )}

            <QuickActionCard
              title="Trusted Contacts"
              icon="people"
              color="#38bdf8"
              onPress={() => navigation.navigate('EmergencyContacts')}
            />

            <QuickActionCard
              title="Biometric Scan"
              icon="scan-circle"
              color="#34d399"
              onPress={() => navigation.navigate('FaceRecognition')}
            />

            <QuickActionCard
              title="Safe Navigation"
              icon="map"
              color="#fbbf24"
              onPress={() => navigation.navigate('SafeRoute')}
            />

            <QuickActionCard
              title="Report Crime"
              icon="alert-circle"
              color="#f97316"
              onPress={() => navigation.navigate('CrimeReport')}
            />

            <QuickActionCard
              title="My Reports"
              icon="document-text"
              color="#8b5cf6"
              onPress={() => navigation.navigate('MyReports')}
            />

            <QuickActionCard
              title="Terminate Session"
              icon="power"
              color="#f87171"
              onPress={handleLogout}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Slate 950
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  headerSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 2,
    marginBottom: 4,
  },
  userText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
  },
  statusActive: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusInactive: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotActive: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  dotInactive: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBarContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  alertWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sosSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  sosHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ef4444',
    letterSpacing: 3,
    marginBottom: 20,
    opacity: 0.8,
  },
  radarContainer: {
    position: 'relative',
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  sosButtonWrapper: {
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  loadingSOS: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#b91c1c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fca5a5',
  },
  sosInstruction: {
    marginTop: 20,
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: 1,
  },
  activeAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  activeAlertText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  actionCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  actionCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 1,
  },
  actionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
    letterSpacing: 0.5,
  },
  voiceControlContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  voiceBtnInactive: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: '#334155',
  },
  voiceBtnActive: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderColor: '#ef4444',
  },
  voiceBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  }
});

export default HomeScreen;
