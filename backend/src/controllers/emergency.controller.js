const emergencyService = require('../services/emergency.service');

class EmergencyController {
  /**
   * Trigger SOS alert
   * POST /api/emergency/sos
   */
  async triggerSOS(req, res, next) {
    try {
      const { location, triggerMethod } = req.body;
      const userId = req.userId;

      if (!location || !location.coordinates) {
        return res.status(400).json({
          success: false,
          message: 'Location coordinates are required'
        });
      }

      const alert = await emergencyService.createSOSAlert(
        userId,
        location,
        triggerMethod || 'button'
      );

      res.status(201).json({
        success: true,
        message: 'SOS alert triggered successfully',
        data: { alert }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update live location for active SOS
   * PATCH /api/emergency/sos/:alertId/location
   */
  async updateSOSLocation(req, res, next) {
    try {
      const { alertId } = req.params;
      const { coordinates, accuracy } = req.body;

      if (!coordinates) {
        return res.status(400).json({
          success: false,
          message: 'Location coordinates are required'
        });
      }

      const alert = await emergencyService.updateSOSLocation(
        alertId,
        coordinates,
        accuracy
      );

      res.status(200).json({
        success: true,
        message: 'Location updated successfully',
        data: { alert }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel SOS alert
   * PATCH /api/emergency/sos/:alertId/cancel
   */
  async cancelSOS(req, res, next) {
    try {
      const { alertId } = req.params;
      const userId = req.userId;

      const alert = await emergencyService.cancelSOSAlert(alertId, userId);

      res.status(200).json({
        success: true,
        message: 'SOS alert cancelled successfully',
        data: { alert }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get SOS alert details
   * GET /api/emergency/sos/:alertId
   */
  async getSOSAlert(req, res, next) {
    try {
      const { alertId } = req.params;

      const alert = await emergencyService.getSOSAlert(alertId);

      res.status(200).json({
        success: true,
        data: { alert }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get nearby active SOS alerts
   * GET /api/emergency/nearby-alerts
   */
  async getNearbyAlerts(req, res, next) {
    try {
      const { latitude, longitude, radius } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      const alerts = await emergencyService.getNearbyAlerts(
        parseFloat(longitude),
        parseFloat(latitude),
        radius ? parseInt(radius) : 5000
      );

      res.status(200).json({
        success: true,
        data: { alerts, count: alerts.length }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add emergency contact
   * POST /api/emergency/contacts
   */
  async addContact(req, res, next) {
    try {
      const { name, phone, relationship } = req.body;
      const userId = req.userId;

      if (!name || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Name and phone are required'
        });
      }

      const contacts = await emergencyService.addEmergencyContact(userId, {
        name,
        phone,
        relationship
      });

      res.status(200).json({
        success: true,
        message: 'Emergency contact added successfully',
        data: { contacts }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove emergency contact
   * DELETE /api/emergency/contacts/:phone
   */
  async removeContact(req, res, next) {
    try {
      const { phone } = req.params;
      const userId = req.userId;

      const contacts = await emergencyService.removeEmergencyContact(userId, phone);

      res.status(200).json({
        success: true,
        message: 'Emergency contact removed successfully',
        data: { contacts }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get emergency contacts
   * GET /api/emergency/contacts
   */
  async getContacts(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        data: { contacts: req.user.emergencyContacts || [] }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload video evidence and email police
   * POST /api/emergency/sos-video
   */
  async uploadEvidence(req, res, next) {
    try {
      console.log('📥 Received video evidence upload request');
      if (!req.file) {
        console.log('❌ No video file in request');
        return res.status(400).json({ success: false, message: 'No video file provided' });
      }
      console.log(`📁 File received: ${req.file.originalname} (${req.file.size} bytes)`);

      const { latitude, longitude } = req.body;
      const userId = req.userId;

      // Start processing in the background to prevent client timeout
      emergencyService.processVideoEvidence(
        userId,
        req.file,
        latitude ? parseFloat(latitude) : 0,
        longitude ? parseFloat(longitude) : 0
      ).catch(error => console.error('Background Video Processing Error:', error));

      res.status(200).json({
        success: true,
        message: 'Evidence upload successful. Notifying police in background.',
        data: { filename: req.file.filename }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmergencyController();
