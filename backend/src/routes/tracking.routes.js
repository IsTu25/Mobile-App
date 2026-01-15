const express = require('express');
const router = express.Router();
const trackingService = require('../services/tracking.service');
const { authenticateToken } = require('../middleware/auth.middleware');
const path = require('path');
const fs = require('fs');

// Start Tracking (Auth required)
router.post('/start', authenticateToken, async (req, res, next) => {
    try {
        const session = await trackingService.startSession(req.user.id);
        const trackingUrl = `${req.protocol}://${req.get('host')}/track/${session._id}`;

        res.status(201).json({
            success: true,
            data: {
                session,
                trackingUrl
            }
        });
    } catch (error) {
        next(error);
    }
});

// Update Location (Auth required)
router.post('/update', authenticateToken, async (req, res, next) => {
    try {
        const { sessionId, ...locationData } = req.body;
        const session = await trackingService.updateLocation(sessionId, locationData);

        res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        next(error);
    }
});

// Stop Tracking (Auth required)
router.post('/stop', authenticateToken, async (req, res, next) => {
    try {
        const { sessionId } = req.body;
        const session = await trackingService.stopSession(sessionId);

        res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        next(error);
    }
});

// Share with Contacts (Auto-SMS)
const smsService = require('../services/sms.service');
const User = require('../models/User');

router.post('/share-with-contacts', authenticateToken, async (req, res, next) => {
    try {
        const { trackingUrl, coordinates } = req.body;
        // User is already attached by authenticateToken middleware
        const user = req.user;

        console.log(`[ShareContacts] User: ${user.userId}, Contacts: ${user.emergencyContacts?.length}`);

        if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
            return res.status(400).json({ success: false, message: 'No emergency contacts found. Please add them in Trusted Contacts.' });
        }

        let sentCount = 0;
        for (const contact of user.emergencyContacts) {
            await smsService.sendEmergencyAlert(
                contact.phone,
                user.fullName,
                trackingUrl,
                coordinates // "lat,lng" string
            );
            sentCount++;
        }

        res.status(200).json({
            success: true,
            message: `Sent location to ${sentCount} contacts.`
        });

    } catch (error) {
        next(error);
    }
});

// Public API to get session data (Poll this)
router.get('/api/:sessionId', async (req, res, next) => {
    try {
        const session = await trackingService.getSession(req.params.sessionId);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

        res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        next(error);
    }
});

// Serve the Map View (HTML)
router.get('/:sessionId', (req, res) => {
    const filePath = path.join(__dirname, '../public', 'index.html');
    res.sendFile(filePath);
});

module.exports = router;
