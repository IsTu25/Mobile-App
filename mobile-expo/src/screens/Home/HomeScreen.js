import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as Location from 'expo-location';
import SOSButton from '../../components/SOS/SOSButton';
import DangerStatusBar from '../../components/Danger/DangerStatusBar';
import NearestDangerAlert from '../../components/Danger/NearestDangerAlert';
import { emergencyAPI } from '../../api/emergencyAPI';
import { dangerAPI } from '../../api/dangerAPI';
import { setActiveAlert } from '../../store/slices/emergencySlice';
import { logout } from '../../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../api/authAPI';

const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [dangerLoading, setDangerLoading] = useState(false);
  const [riskData, setRiskData] = useState(null);
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { isSOSActive } = useSelector(state => state.emergency);

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
    })();
  }, []);

  const fetchDangerPrediction = async (latitude, longitude) => {
    setDangerLoading(true);
    try {
      // Use traditional risk score (has nearestHotspot data)
      const response = await dangerAPI.getRiskScore(latitude, longitude);
      console.log('✅ Danger prediction response:', JSON.stringify(response.data, null, 2));
      setRiskData(response.data);
    } catch (error) {
      console.error('❌ Failed to fetch danger prediction:', error);
      console.error('Error details:', error.response?.data || error.message);

      // Set a default safe state if API fails
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

  const handleSOSTrigger = async () => {
    if (!location) {
      Alert.alert('Waiting for location...');
      return;
    }

    // Directly trigger SOS without confirmation
    triggerSOSAlert();
  };
  const triggerSOSAlert = async () => {
    setLoading(true);

    try {
      const result = await emergencyAPI.triggerSOS(
        {
          type: 'Point',
          coordinates: [location.longitude, location.latitude],
        },
        'button'
      );

      // Navigate to Video Evidence Screen immediately
      navigation.navigate('SOSVideo');

      dispatch(setActiveAlert(result.data.alert));

      //     },
      //   ]
      // );
      // We don't show alert here anymore because we are navigating to Video Screen immediately.
      // The Video Screen handles the "calling police" and "evidence" part.
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to trigger SOS';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call API to logout (optional, best effort)
              await authAPI.logout();
            } catch (error) {
              console.log('Logout API failed', error);
            }
            // Clear local storage and state
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
            await AsyncStorage.removeItem('user');
            dispatch(logout());

            // Navigate to Login
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
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

    Alert.alert('Danger Zone Details', detailsMessage, [
      { text: 'OK', style: 'default' }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Danger Status Bar - Red/Green indicator */}
      <DangerStatusBar
        riskLevel={riskData?.riskLevel}
        riskScore={riskData?.riskScore}
        currentZone={riskData?.location?.currentZone}
        loading={dangerLoading}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome, {user?.fullName}!</Text>
          <Text style={styles.statusText}>
            {location ? '✓ Location Active' : '⚠ Location Not Available'}
          </Text>
        </View>

        {/* Nearest Danger Zone Alert */}
        <NearestDangerAlert
          nearestHotspot={riskData?.location?.nearestHotspot}
          currentZone={riskData?.location?.currentZone}
          onViewDetails={handleViewDangerDetails}
        />

        <View style={styles.sosContainer}>
          <Text style={styles.title}>Emergency SOS</Text>
          <Text style={styles.subtitle}>
            Hold the button for 2 seconds to trigger an emergency alert
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color="#e63946" />
          ) : (
            <SOSButton onTrigger={handleSOSTrigger} disabled={isSOSActive} />
          )}

          {isSOSActive && (
            <View style={styles.activeAlert}>
              <Text style={styles.activeAlertText}>🚨 SOS Alert Active</Text>
            </View>
          )}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('EmergencyContacts')}>
            <Text style={styles.actionButtonText}>📞 Manage Emergency Contacts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('FaceRecognition')}>
            <Text style={styles.actionButtonText}>👁️ Scan Faces</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  activeAlert: {
    marginTop: 30,
    backgroundColor: '#e63946',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  activeAlertText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActions: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  logoutText: {
    fontSize: 16,
    color: '#e63946',
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#e63946',
    borderRadius: 8,
  },
});

export default HomeScreen;
