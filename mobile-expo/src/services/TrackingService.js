import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import apiClient from '../api/apiClient';
import { Alert, Platform } from 'react-native';

const LOCATION_TRACKING_TASK_NAME = 'background-location-task';
let currentSessionId = null;
let foregroundSubscription = null; // Fallback for Expo Go

// Define the background task
TaskManager.defineTask(LOCATION_TRACKING_TASK_NAME, async ({ data, error }) => {
    if (error) {
        // console.error("Background Location Task Error:", error);
        return;
    }
    if (data) {
        const { locations } = data;
        const location = locations[0];
        await sendLocationUpdate(location);
    }
});

const sendLocationUpdate = async (location) => {
    if (currentSessionId && location) {
        try {
            await apiClient.post('/tracking/update', {
                sessionId: currentSessionId,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                heading: location.coords.heading,
                speed: location.coords.speed,
                accuracy: location.coords.accuracy
            });
            console.log('[Tracking] Location updated:', location.coords.latitude, location.coords.longitude);
        } catch (err) {
            console.error('[Tracking] Update failed:', err);
        }
    }
};

const TrackingService = {
    startSharing: async () => {
        try {
            // 1. Check Permissions (Foreground is mandatory)
            const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
            if (fgStatus !== 'granted') throw new Error('Location permission required');

            // Attempt Background Permissions (optional flow, but we try)
            let canUseBackground = false;
            try {
                const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
                if (bgStatus === 'granted') canUseBackground = true;
            } catch (e) {
                console.log('[Tracking] Background permission request failed (likely Expo Go limitation on iOS):', e);
            }

            // 2. Start Session on Backend
            const response = await apiClient.post('/tracking/start');
            const { session, trackingUrl } = response.data.data;
            currentSessionId = session._id;

            // 3. Start Location Updates
            try {
                // Try Background First
                if (canUseBackground) {
                    await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK_NAME, {
                        accuracy: Location.Accuracy.BestForNavigation,
                        timeInterval: 5000,
                        distanceInterval: 10,
                        foregroundService: {
                            notificationTitle: "Live Location Active",
                            notificationBody: "Sharing your real-time location with contacts."
                        },
                        // iOS specific: 'always' is required for background, but fails in Expo Go if keys missing
                        showsBackgroundLocationIndicator: true
                    });
                    console.log('[Tracking] Started Background Mode');
                } else {
                    throw new Error('Background permission not granted');
                }
            } catch (bgError) {
                console.warn('[Tracking] Background Start Failed (Fallback to Foreground):', bgError.message);

                // FALLBACK: Foreground Watcher
                // This works while app is open. Best we can do in Expo Go without config plugins.
                if (foregroundSubscription) {
                    foregroundSubscription.remove();
                }
                foregroundSubscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.BestForNavigation,
                        timeInterval: 5000,
                        distanceInterval: 10
                    },
                    (location) => sendLocationUpdate(location)
                );
                console.log('[Tracking] Started Foreground Mode (Fallback)');
            }

            return { trackingUrl, sessionId: currentSessionId };

        } catch (error) {
            console.error('[Tracking] Start Failed:', error);
            throw error;
        }
    },

    stopSharing: async () => {
        try {
            if (currentSessionId) {
                await apiClient.post('/tracking/stop', { sessionId: currentSessionId });
                currentSessionId = null;
            }

            // Stop Background Task
            const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING_TASK_NAME);
            if (isRegistered) {
                await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK_NAME);
            }

            // Stop Foreground Watcher
            if (foregroundSubscription) {
                foregroundSubscription.remove();
                foregroundSubscription = null;
            }

            console.log('[Tracking] Stopped');
        } catch (error) {
            console.error('[Tracking] Stop Failed:', error);
        }
    },

    isActive: async () => {
        const bgActive = await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING_TASK_NAME);
        return bgActive || !!foregroundSubscription;
    },
};

export default TrackingService;
