import apiClient from './apiClient';

/**
 * Danger Prediction API
 * Interfaces with the Bangladesh crime dataset-based danger prediction system
 */
export const dangerAPI = {
    /**
     * Get AI-based risk score for a location
     * @param {number} latitude 
     * @param {number} longitude 
     * @returns {Promise} Risk prediction data
     */
    getAIRiskScore: async (latitude, longitude) => {
        try {
            const response = await apiClient.post('/danger/ai-risk-score', {
                latitude,
                longitude
            });
            return response.data;
        } catch (error) {
            console.error('Error getting AI risk score:', error);
            throw error;
        }
    },

    /**
     * Get traditional risk score for a location
     * @param {number} latitude 
     * @param {number} longitude 
     * @returns {Promise} Risk assessment data
     */
    getRiskScore: async (latitude, longitude) => {
        try {
            const response = await apiClient.post('/danger/risk-score', {
                latitude,
                longitude
            });
            return response.data;
        } catch (error) {
            console.error('Error getting risk score:', error);
            throw error;
        }
    },

    /**
     * Get nearby crime incidents
     * @param {number} latitude 
     * @param {number} longitude 
     * @param {number} radius - Radius in meters (default: 2000)
     * @returns {Promise} Nearby incidents data
     */
    getNearbyIncidents: async (latitude, longitude, radius = 2000) => {
        try {
            const response = await apiClient.get('/danger/nearby-incidents', {
                params: { latitude, longitude, radius }
            });
            return response.data;
        } catch (error) {
            console.error('Error getting nearby incidents:', error);
            throw error;
        }
    },

    /**
     * Get all crime hotspots
     * @returns {Promise} Crime hotspots data
     */
    getHotspots: async () => {
        try {
            const response = await apiClient.get('/danger/hotspots');
            return response.data;
        } catch (error) {
            console.error('Error getting hotspots:', error);
            throw error;
        }
    },

    /**
     * Get safe route suggestion
     * @param {number} fromLat 
     * @param {number} fromLon 
     * @param {number} toLat 
     * @param {number} toLon 
     * @returns {Promise} Safe route data
     */
    getSafeRoute: async (fromLat, fromLon, toLat, toLon) => {
        try {
            const response = await apiClient.post('/danger/safe-route', {
                fromLat,
                fromLon,
                toLat,
                toLon
            });
            return response.data;
        } catch (error) {
            console.error('Error getting safe route:', error);
            throw error;
        }
    },

    /**
     * Analyze full route path for safety
     * @param {Array<{latitude: number, longitude: number}>} routePath 
     * @returns {Promise} Safety analysis
     */
    analyzeRoute: async (routePath) => {
        try {
            const response = await apiClient.post('/danger/analyze-route', {
                routePath
            });
            return response.data;
        } catch (error) {
            console.error('Error analyzing route:', error);
            throw error;
        }
    },

    /**
     * Get dataset statistics
     * @returns {Promise} Dataset stats
     */
    getStats: async () => {
        try {
            const response = await apiClient.get('/danger/stats');
            return response.data;
        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    },

    /**
     * Get AI model information
     * @returns {Promise} AI model info
     */
    getAIModelInfo: async () => {
        try {
            const response = await apiClient.get('/danger/ai-model-info');
            return response.data;
        } catch (error) {
            console.error('Error getting AI model info:', error);
            throw error;
        }
    }
};
