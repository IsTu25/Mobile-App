const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergency.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// All emergency routes require authentication
router.use(authenticateToken);

// SOS Alert routes
router.post('/sos', emergencyController.triggerSOS);
router.patch('/sos/:alertId/location', emergencyController.updateSOSLocation);
router.patch('/sos/:alertId/cancel', emergencyController.cancelSOS);
router.get('/sos/:alertId', emergencyController.getSOSAlert);
router.post('/sos-video', upload.single('video'), emergencyController.uploadEvidence);
router.get('/nearby-alerts', emergencyController.getNearbyAlerts);

// Emergency Contacts routes
router.get('/contacts', emergencyController.getContacts);
router.post('/contacts', emergencyController.addContact);
router.delete('/contacts/:phone', emergencyController.removeContact);

module.exports = router;
