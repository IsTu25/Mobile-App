const SOSAlert = require('../models/SOSAlert');
const PoliceStation = require('../models/PoliceStation');
const User = require('../models/User');
const { generateId } = require('../utils/id-generator');
const smsService = require('./sms.service');
const notificationService = require('./notification.service');
const recognitionService = require('./recognition.service');
const config = require('../config/env');

class EmergencyService {
  /**
   * Create SOS alert
   */
  async createSOSAlert(
    userId,
    location,
    triggerMethod = 'button',
    matchedHotword = null,
    transcription = null,
    voiceConfidence = null
  ) {
    try {
      // Get user details
      const user = await User.findOne({ userId });

      if (!user) {
        throw new Error('User not found');
      }

      // Create SOS alert
      const alert = new SOSAlert({
        alertId: generateId('SOS'),
        userId: user._id,
        userName: user.fullName,
        userPhone: user.phoneNumber,
        location: {
          type: 'Point',
          coordinates: location.coordinates
        },
        triggerMethod,
        voiceActivated: triggerMethod === 'voice',
        matchedHotword,
        transcription,
        voiceConfidence,
        status: 'active'
      });

      // Find nearest 3 police stations within 10km
      const nearestStations = await this.findNearestPoliceStations(
        location.coordinates[0],
        location.coordinates[1],
        10000
      );

      // Notify police stations
      for (const station of nearestStations) {
        alert.notifiedPoliceStations.push({
          stationId: station._id,
          stationName: station.name,
          distance: station.distance,
          notifiedAt: new Date()
        });

        console.log(`🚓 Alerting police station: ${station.name} (${Math.round(station.distance)}m away)`);

        // Send SMS to Police Station
        if (station.phone) {
          const coordinatesStr = `${location.coordinates[1]},${location.coordinates[0]}`;
          const locationUrl = location.trackingUrl
            ? location.trackingUrl
            : `https://maps.google.com/?q=${location.coordinates[1]},${location.coordinates[0]}`;

          // Add voice info to SMS if applicable
          let voiceInfo = '';
          if (triggerMethod === 'voice') {
            voiceInfo = ` [VOICE: "${matchedHotword}"]`;
          }

          await smsService.sendEmergencyAlert(
            station.phone,
            user.fullName + voiceInfo,
            locationUrl,
            coordinatesStr
          );
        }
      }

      // Notify emergency contacts via SMS
      if (user.emergencyContacts && user.emergencyContacts.length > 0) {
        const locationUrl = location.trackingUrl
          ? location.trackingUrl
          : `https://maps.google.com/?q=${location.coordinates[1]},${location.coordinates[0]}`;

        for (const contact of user.emergencyContacts) {
          const coordinatesStr = `${location.coordinates[1]},${location.coordinates[0]}`;

          let voiceInfo = '';
          if (triggerMethod === 'voice') {
            voiceInfo = ` [VOICE: "${matchedHotword}"]`;
          }

          const smsResult = await smsService.sendEmergencyAlert(
            contact.phone,
            user.fullName + voiceInfo,
            locationUrl,
            coordinatesStr
          );

          alert.notifiedContacts.push({
            contactName: contact.name,
            contactPhone: contact.phone,
            notifiedAt: new Date(),
            deliveryStatus: smsResult.success ? 'sent' : 'failed'
          });
        }
      }

      // Notify nearby users (within 500m)
      const nearbyNotification = await notificationService.sendToNearbyUsers(
        location.coordinates[0],
        location.coordinates[1],
        500,
        triggerMethod === 'voice' ? '🚨 VOICE SOS ACTIVATED' : '🚨 SOS Alert Nearby',
        triggerMethod === 'voice'
          ? `${user.fullName} screamed "${matchedHotword}". Help needed!`
          : `${user.fullName} needs help nearby. Please assist if safe to do so.`,
        {
          type: 'sos_alert',
          alertId: alert.alertId,
          latitude: location.coordinates[1].toString(),
          longitude: location.coordinates[0].toString(),
          voiceTriggered: (triggerMethod === 'voice').toString()
        }
      );

      if (nearbyNotification.success && nearbyNotification.notifiedUsers) {
        alert.notifiedNearbyUsers = nearbyNotification.notifiedUsers.map(u => ({
          userId: u.userId,
          distance: u.distance,
          notifiedAt: new Date()
        }));
      }

      await alert.save();

      console.log(`✅ SOS Alert created: ${alert.alertId} (${triggerMethod})`);
      return alert;
    } catch (error) {
      console.error('❌ Error creating SOS alert:', error);
      throw error;
    }
  }

  /**
   * Update live location for active SOS alert
   */
  async updateSOSLocation(alertId, coordinates, accuracy) {
    const alert = await SOSAlert.findOne({ alertId, status: 'active' });

    if (!alert) {
      throw new Error('Active SOS alert not found');
    }

    // Add location update
    alert.locationUpdates.push({
      coordinates,
      timestamp: new Date(),
      accuracy
    });

    // Update main location
    alert.location.coordinates = coordinates;

    await alert.save();

    console.log(`📍 Location updated for SOS: ${alertId}`);

    return alert;
  }

  /**
   * Cancel SOS alert
   */
  async cancelSOSAlert(alertId, userId) {
    const alert = await SOSAlert.findOne({ alertId });

    if (!alert) {
      throw new Error('SOS alert not found');
    }

    // Verify ownership
    const user = await User.findOne({ userId });
    if (alert.userId.toString() !== user._id.toString()) {
      throw new Error('Unauthorized to cancel this alert');
    }

    alert.status = 'cancelled';
    alert.resolvedAt = new Date();

    await alert.save();

    console.log(`✅ SOS Alert cancelled: ${alertId}`);

    return alert;
  }

  /**
   * Get SOS alert details
   */
  async getSOSAlert(alertId) {
    const alert = await SOSAlert.findOne({ alertId })
      .populate('userId', 'fullName phoneNumber');

    if (!alert) {
      throw new Error('SOS alert not found');
    }

    return alert;
  }

  /**
   * Get nearby active SOS alerts
   */
  async getNearbyAlerts(longitude, latitude, radiusMeters = 5000) {
    const alerts = await SOSAlert.find({
      status: 'active',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusMeters
        }
      }
    }).limit(20);

    return alerts;
  }

  /**
   * Add/Update emergency contact
   */
  async addEmergencyContact(userId, contactData) {
    const user = await User.findOne({ userId });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if contact already exists
    const existingIndex = user.emergencyContacts.findIndex(
      c => c.phone === contactData.phone
    );

    if (existingIndex >= 0) {
      // Update existing contact
      user.emergencyContacts[existingIndex] = contactData;
    } else {
      // Add new contact
      user.emergencyContacts.push(contactData);
    }

    await user.save();

    console.log(`✅ Emergency contact added for user: ${userId}`);

    return user.emergencyContacts;
  }

  /**
   * Remove emergency contact
   */
  async removeEmergencyContact(userId, phone) {
    const user = await User.findOne({ userId });

    if (!user) {
      throw new Error('User not found');
    }

    user.emergencyContacts = user.emergencyContacts.filter(
      c => c.phone !== phone
    );

    await user.save();

    console.log(`✅ Emergency contact removed for user: ${userId}`);

    return user.emergencyContacts;
  }

  /**
   * Find nearest police stations
   */
  async findNearestPoliceStations(longitude, latitude, maxDistanceMeters = 10000) {
    const stations = await PoliceStation.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          distanceField: 'distance',
          maxDistance: maxDistanceMeters,
          spherical: true,
          query: { isActive: true }
        }
      },
      {
        $limit: 3
      }
    ]);

    return stations;
  }

  /**
   * Process uploaded video evidence
   */
  async processVideoEvidence(userId, file, latitude, longitude) {
    console.log(`🎬 Processing video evidence for user: ${userId}`);
    const user = await User.findOne({ userId });
    if (!user) throw new Error('User not found');

    // 1. Find nearest police station
    let targetStation = await PoliceStation.findOne({ phone: '01798126118' });

    if (!targetStation) {
      // Fallback to nearest
      const stations = await this.findNearestPoliceStations(longitude, latitude, 50000);
      if (stations.length > 0) targetStation = stations[0];
    }

    if (!targetStation) {
      throw new Error('No police station found to notify');
    }

    // 2. Run Video Recognition
    console.log(`Analyzing video for known entities: ${file.path}`);
    let recognitionResult = null;
    try {
      recognitionResult = await recognitionService.processVideo(file.path);
    } catch (err) {
      console.error('Recognition Service Video Processing Error:', err);
    }

    // 3. Prepare Email
    const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    let subject = `🚨 URGENT: SOS Video Evidence from ${user.fullName}`;

    // Generate Video Link (Using SERVER_URL and PORT)
    const videoLink = `http://${config.SERVER_URL || 'localhost'}:${config.PORT || 3000}/uploads/${file.filename}`;

    let text = `
User: ${user.fullName}
Phone: ${user.phoneNumber}
Location: ${locationUrl}

📄 EVIDENCE VIDEO LINK:
${videoLink}

(Please copy and paste the link if it is not clickable)
`;

    const attachments = [];

    // Check file size using fs
    const fs = require('fs');
    const path = require('path');
    const ffmpeg = require('fluent-ffmpeg');

    let attachmentPath = file.path;
    let attachmentFilename = 'evidence.mp4';
    let cleanupCompressed = false;

    try {
      const stats = fs.statSync(file.path);
      const fileSizeInBytes = stats.size;
      // Absolute max safe size for Gmail attachment (Base64 overhead): ~17MB
      // 17MB file becomes ~22.6MB encoded (Safe within 25MB limit).
      const MAX_SAFE_SIZE = 17 * 1024 * 1024;

      if (fileSizeInBytes > MAX_SAFE_SIZE) {
        console.log(`⚠️ Video is too large (${(fileSizeInBytes / 1024 / 1024).toFixed(2)}MB) for direct attachment.`);
        console.log('🔄 Attempting to compress video...');

        const compressedPath = path.join(path.dirname(file.path), `compressed_${file.filename}.mp4`);

        await new Promise((resolve, reject) => {
          ffmpeg(file.path)
            .outputOptions([
              '-vcodec libx264',
              '-crf 32',         // Good compression to meet 17MB target
              '-preset ultrafast',
              '-vf scale=-2:480' // Downscale to 480p
            ])
            .save(compressedPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err));
        });

        // Verify compressed size
        const compressedStats = fs.statSync(compressedPath);
        if (compressedStats.size < MAX_SAFE_SIZE) {
          console.log(`✅ Compression successful! New size: ${(compressedStats.size / 1024 / 1024).toFixed(2)}MB`);
          attachmentPath = compressedPath;
          cleanupCompressed = true;
          text += `\n(Note: Video was automatically compressed to fit email limits. High-quality version available via link.)\n`;
        } else {
          console.log('⚠️ Compressed video still too large. Falling back to link.');
          text += `\n(Video is too large to attach. Please use the link above to view)\n`;
          // cleanup immediately if useless
          fs.unlinkSync(compressedPath);
          attachmentPath = null;
        }
      }

      if (attachmentPath) {
        attachments.push({
          filename: attachmentFilename,
          path: attachmentPath
        });
        text += `\n(Video file is attached below)\n`;
      }
    } catch (err) {
      console.error('Error handling video attachment:', err);
    }

    if (recognitionResult && recognitionResult.matches && recognitionResult.matches.length > 0) {
      subject = `⚠️ MATCH FOUND: ${recognitionResult.matches.length} Person(s) Identified - ` + subject;

      text += `
----------------------------------------
⚠️⚠️ ALERT: MATCHES FOUND IN VIDEO ⚠️⚠️
System detected known individuals from the watch list.

`;

      recognitionResult.matches.forEach((match, index) => {
        text += `
--- PERSON ${index + 1} ---
NAME: ${match.person?.name || match.name}
INFO: ${match.person?.info || 'N/A'}
EMAIL: ${match.person?.email || 'N/A'}
CONFIDENCE: ${(match.confidence * 100).toFixed(1)}%
`;
        if (match.evidenceImage) {
          attachments.push({
            filename: `match_${match.name.replace(/\s+/g, '_')}.png`,
            path: match.evidenceImage
          });
        }
      });

      text += `
----------------------------------------
`;
    }

    if (recognitionResult && recognitionResult.unknownCount > 0) {
      text += `
⚠️ UNIDENTIFIED FACES DETECTED: ${recognitionResult.unknownCount}
(Faces were detected but did not match the watch list)
----------------------------------------
`;
    }

    // 4. Send Email using Nodemailer
    const nodemailer = require('nodemailer');

    if (config.EMAIL_USER && config.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: config.EMAIL_SERVICE,
        auth: {
          user: config.EMAIL_USER,
          pass: config.EMAIL_PASS
        },
        // Reliability settings for Gmail
        pool: true, // Use pooled connections
        maxConnections: 1, // Limit connections to avoid Gmail blocking
        rateLimit: 1, // Limit rate
        secure: true,
        port: 465,
        debug: true, // Show debug logs
        logger: true, // Log to console
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      });

      await transporter.sendMail({
        from: `"${user.fullName} (via Nirapotta)" <${config.EMAIL_USER}>`,
        to: targetStation.email,
        replyTo: user.email,
        subject: subject,
        text: text,
        attachments: attachments
      });

      console.log(`✅ Video sent to police: ${targetStation.email}`);
      if (recognitionResult?.matches?.length > 0) console.log(`   (Included ${recognitionResult.matches.length} recognition matches)`);
    } else {
      console.log('⚠️ Email credentials missing, skipping actual send');
    }

    // 5. Send Video Link via WhatsApp & SMS
    try {
      const sosMessage = `🚨 VIDEO EVIDENCE: ${user.fullName} has uploaded video for the alert. Watch: ${videoLink}`;

      // Send Video Link via WhatsApp
      await smsService.sendWhatsAppMessage(targetStation.phone, sosMessage);

      // Also Send Video Link via SMS (for redundancy)
      await smsService.sendEmergencyAlert(targetStation.phone, user.fullName, videoLink);
    } catch (waError) {
      console.error('Failed to send SOS Video Alerts:', waError);
    }

    console.log('🏁 Video evidence processing complete');

    // Cleanup compressed file if it was created
    if (cleanupCompressed && attachmentPath && require('fs').existsSync(attachmentPath)) {
      try {
        require('fs').unlinkSync(attachmentPath);
        console.log('🧹 Cleaned up compressed video file');
      } catch (err) {
        console.error('Failed to cleanup compressed video:', err);
      }
    }

    return {
      stationName: targetStation.name,
      stationEmail: targetStation.email,
      recognition: recognitionResult ? {
        matches: recognitionResult.matches.length,
        unknownCount: recognitionResult.unknownCount
      } : null
    };
  }
}

module.exports = new EmergencyService();
