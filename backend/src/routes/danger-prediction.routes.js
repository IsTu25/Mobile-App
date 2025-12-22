const express = require('express');
const router = express.Router();
const dangerPredictionController = require('../controllers/danger-prediction.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Public routes (for testing/demo)
router.post('/risk-score', dangerPredictionController.getRiskScore);
router.get('/nearby-incidents', dangerPredictionController.getNearbyIncidents);
router.post('/safe-route', dangerPredictionController.getSafeRoute);
router.get('/hotspots', dangerPredictionController.getHotspots);
router.get('/stats', dangerPredictionController.getDatasetStats);

// NEW: AI Model routes (trained on Bangladesh data)
router.post('/ai-risk-score', dangerPredictionController.getAIRiskScore);
router.get('/ai-model-info', dangerPredictionController.getAIModelInfo);

// Protected routes (require authentication)
// Uncomment when ready to require auth
// router.use(authenticateToken);
// router.post('/risk-score', dangerPredictionController.getRiskScore);

module.exports = router;
