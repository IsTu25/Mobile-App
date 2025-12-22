const dangerPredictionService = require('../services/danger-prediction.service');
const aiModel = require('../services/ai-danger-model.service');

class DangerPredictionController {
    /**
     * NEW: Get AI-predicted risk score (trained on Bangladesh data)
     * POST /api/danger/ai-risk-score
     * Body: { latitude, longitude }
     */
    async getAIRiskScore(req, res, next) {
        try {
            const { latitude, longitude } = req.body;

            if (!latitude || !longitude) {
                return res.status(400).json({
                    success: false,
                    message: 'Latitude and longitude are required'
                });
            }

            const prediction = await aiModel.predict(
                parseFloat(latitude),
                parseFloat(longitude)
            );

            res.status(200).json({
                success: true,
                message: 'AI prediction complete',
                data: prediction,
                model: 'AI-Trained on 1,107 Bangladesh crime records'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get AI model information
     * GET /api/danger/ai-model-info
     */
    async getAIModelInfo(req, res, next) {
        try {
            const modelInfo = aiModel.getModelInfo();

            res.status(200).json({
                success: true,
                message: 'AI model information retrieved',
                data: modelInfo
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get current risk score for a location
     * POST /api/danger/risk-score
     * Body: { latitude, longitude }
     */
    async getRiskScore(req, res, next) {
        try {
            const { latitude, longitude } = req.body;

            if (!latitude || !longitude) {
                return res.status(400).json({
                    success: false,
                    message: 'Latitude and longitude are required'
                });
            }

            const riskData = await dangerPredictionService.calculateRiskScore(
                parseFloat(latitude),
                parseFloat(longitude)
            );

            res.status(200).json({
                success: true,
                message: 'Risk score calculated successfully',
                data: riskData
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get nearby crime incidents
     * GET /api/danger/nearby-incidents
     * Query: latitude, longitude, radius (optional, default 2000m)
     */
    async getNearbyIncidents(req, res, next) {
        try {
            const { latitude, longitude, radius } = req.query;

            if (!latitude || !longitude) {
                return res.status(400).json({
                    success: false,
                    message: 'Latitude and longitude are required'
                });
            }

            const radiusMeters = radius ? parseInt(radius) : 2000;

            const incidents = dangerPredictionService.getNearbyIncidents(
                parseFloat(latitude),
                parseFloat(longitude),
                radiusMeters
            );

            res.status(200).json({
                success: true,
                message: `Found ${incidents.length} incidents within ${radiusMeters}m`,
                data: {
                    incidents,
                    count: incidents.length,
                    radius: radiusMeters
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get safe route suggestion
     * POST /api/danger/safe-route
     * Body: { fromLat, fromLon, toLat, toLon }
     */
    async getSafeRoute(req, res, next) {
        try {
            const { fromLat, fromLon, toLat, toLon } = req.body;

            if (!fromLat || !fromLon || !toLat || !toLon) {
                return res.status(400).json({
                    success: false,
                    message: 'All coordinates are required (fromLat, fromLon, toLat, toLon)'
                });
            }

            const routeData = await dangerPredictionService.getSafeRoute(
                parseFloat(fromLat),
                parseFloat(fromLon),
                parseFloat(toLat),
                parseFloat(toLon)
            );

            res.status(200).json({
                success: true,
                message: 'Route analysis complete',
                data: routeData
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all crime hotspots
     * GET /api/danger/hotspots
     */
    async getHotspots(req, res, next) {
        try {
            const hotspots = dangerPredictionService.crimeHotspots;

            res.status(200).json({
                success: true,
                message: `Retrieved ${hotspots.length} crime hotspots`,
                data: {
                    hotspots,
                    count: hotspots.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get dataset statistics
     * GET /api/danger/stats
     */
    async getDatasetStats(req, res, next) {
        try {
            // Ensure dataset is loaded
            if (!dangerPredictionService.datasetLoaded) {
                await dangerPredictionService.loadCrimeDataset();
            }

            const stats = {
                totalRecords: dangerPredictionService.crimeData.length,
                hotspots: dangerPredictionService.crimeHotspots.length,
                datasetLoaded: dangerPredictionService.datasetLoaded,
                crimeTypes: {},
                thanas: {}
            };

            // Calculate crime type distribution
            dangerPredictionService.crimeData.forEach(crime => {
                stats.crimeTypes[crime.crimeType] = (stats.crimeTypes[crime.crimeType] || 0) + 1;
                stats.thanas[crime.thana] = (stats.thanas[crime.thana] || 0) + 1;
            });

            res.status(200).json({
                success: true,
                message: 'Dataset statistics retrieved',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DangerPredictionController();
