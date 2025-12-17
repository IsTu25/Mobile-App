const User = require('../models/User');
const { sendPushNotification, sendMulticastNotification } = require('../config/firebase');

class NotificationService {
  /**
   * Send push notification to a single user
   */
  async sendToUser(userId, title, body, data = {}) {
    try {
      const user = await User.findOne({ userId });
      
      if (!user || !user.fcmToken) {
        console.log(`⚠️  No FCM token for user: ${userId}`);
        return { success: false, error: 'No FCM token' };
      }
      
      return await sendPushNotification(user.fcmToken, title, body, data);
    } catch (error) {
      console.error('❌ Error sending notification to user:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send push notification to nearby users
   */
  async sendToNearbyUsers(longitude, latitude, radiusMeters, title, body, data = {}) {
    try {
      // Find users within radius who have enabled nearby alerts
      const nearbyUsers = await User.find({
        lastKnownLocation: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: radiusMeters
          }
        },
        'settings.receiveNearbyAlerts': true,
        fcmToken: { $exists: true, $ne: null }
      }).limit(50); // Limit to prevent spam
      
      if (nearbyUsers.length === 0) {
        console.log('⚠️  No nearby users to notify');
        return { success: true, count: 0 };
      }
      
      const fcmTokens = nearbyUsers.map(user => user.fcmToken);
      
      console.log(`📱 Notifying ${nearbyUsers.length} nearby users`);
      
      const result = await sendMulticastNotification(fcmTokens, title, body, data);
      
      return {
        success: true,
        totalUsers: nearbyUsers.length,
        notifiedUsers: nearbyUsers.map(u => ({
          userId: u.userId,
          distance: this.calculateDistance(
            longitude, latitude,
            u.lastKnownLocation.coordinates[0],
            u.lastKnownLocation.coordinates[1]
          )
        })),
        ...result
      };
    } catch (error) {
      console.error('❌ Error sending notifications to nearby users:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lon1, lat1, lon2, lat2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c); // Distance in meters
  }
}

module.exports = new NotificationService();
