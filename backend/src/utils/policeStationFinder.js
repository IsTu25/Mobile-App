const PoliceStation = require('../models/PoliceStation');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

/**
 * Find the nearest police station to given coordinates
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @returns {Promise<Object>} Nearest police station with distance
 */
async function findNearestPoliceStation(userLat, userLon) {
    try {
        const stations = await PoliceStation.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [userLon, userLat] },
                    distanceField: "distance",
                    spherical: true,
                    query: { isActive: true }
                }
            },
            { $limit: 1 }
        ]);

        if (stations.length === 0) return null;

        const station = stations[0];
        return {
            ...station,
            distanceKm: (station.distance / 1000).toFixed(2)
        };
    } catch (error) {
        console.error('Error finding nearest police station:', error);
        throw error;
    }
}

/**
 * Find N nearest police stations to given coordinates
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} count - Number of stations to return (default: 3)
 * @returns {Promise<Array>} Array of nearest police stations with distances
 */
async function findNearestPoliceStations(userLat, userLon, count = 3) {
    try {
        const stations = await PoliceStation.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [userLon, userLat] },
                    distanceField: "distance",
                    spherical: true,
                    query: { isActive: true }
                }
            },
            { $limit: count }
        ]);

        return stations.map(station => ({
            ...station,
            distanceKm: (station.distance / 1000).toFixed(2)
        }));
    } catch (error) {
        console.error('Error finding nearest police stations:', error);
        throw error;
    }
}

module.exports = {
    findNearestPoliceStation,
    findNearestPoliceStations,
    calculateDistance,
};
