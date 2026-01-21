const admin = require('firebase-admin');
const config = require('./env');

let firebaseApp = null;

const initializeFirebase = () => {
  try {
    let credential;

    // Option 1: Render/Cloud Deployment (Single JSON Environment Variable)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = admin.credential.cert(serviceAccount);
      } catch (e) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
      }
    }

    // Option 2: Local Development (Separate Variables from .env)
    if (!credential) {
      if (!config.FIREBASE_PROJECT_ID || !config.FIREBASE_PRIVATE_KEY || !config.FIREBASE_CLIENT_EMAIL) {
        console.log('⚠️  Firebase credentials not provided. Running in mock mode.');
        return null;
      }
      credential = admin.credential.cert({
        projectId: config.FIREBASE_PROJECT_ID,
        clientEmail: config.FIREBASE_CLIENT_EMAIL,
        privateKey: config.FIREBASE_PRIVATE_KEY,
      });
    }

    // Initialize Firebase Admin
    firebaseApp = admin.initializeApp({
      credential,
    });

    console.log('✅ Firebase Admin initialized');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error.message);
    console.log('⚠️  Continuing without Firebase (push notifications disabled)');
    return null;
  }
};

/**
 * Send push notification to user
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!firebaseApp) {
    console.log('📱 Mock: Would send notification:', { title, body, data });
    return { success: true, mock: true };
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data,
      token: fcmToken,
    };

    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to multiple users
 */
const sendMulticastNotification = async (fcmTokens, title, body, data = {}) => {
  if (!firebaseApp) {
    console.log('📱 Mock: Would send notifications to', fcmTokens.length, 'users');
    return { success: true, mock: true };
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data,
      tokens: fcmTokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`✅ Successfully sent ${response.successCount} notifications`);

    if (response.failureCount > 0) {
      console.warn(`⚠️  ${response.failureCount} notifications failed`);
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('❌ Error sending multicast notification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  initializeFirebase,
  sendPushNotification,
  sendMulticastNotification,
};
