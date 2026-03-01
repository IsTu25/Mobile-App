import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { authAPI } from '../api/authAPI';

export const NotificationService = {
    // 1. Request Permissions and get Token
    registerForPushNotificationsAsync: async () => {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return;
            }
            // Project ID is required for Expo Push Token in later versions
            token = (await Notifications.getExpoPushTokenAsync()).data;
            console.log('Expo Push Token:', token);

            // Send to backend
            try {
                await authAPI.updateFCMToken(token);
            } catch (e) {
                console.log('Failed to save push token to backend:', e);
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        return token;
    },

    // 2. Setup Listeners
    initListeners: (onReceived, onResponse) => {
        // This listener is fired whenever a notification is received while the app is foregrounded
        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification Received (Foreground):', notification);
            if (onReceived) onReceived(notification);
        });

        // This listener is fired whenever a user taps on or interacts with a notification
        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification Tapped:', response);
            if (onResponse) onResponse(response);
        });

        return () => {
            notificationListener.remove();
            responseListener.remove();
        };
    }
};

export default NotificationService;
