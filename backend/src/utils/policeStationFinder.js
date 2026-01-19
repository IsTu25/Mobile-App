const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

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
 * Load police stations from CSV file
 * @returns {Promise<Array>} Array of police station objects
 */
function loadPoliceStations() {
    return new Promise((resolve, reject) => {
        const stations = [];
        const csvPath = path.join(__dirname, '../../data/police_stations.csv');

        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (row) => {
                stations.push({
                    name: row.name,
                    district: row.district,
                    division: row.division,
                    latitude: parseFloat(row.latitude),
                    longitude: parseFloat(row.longitude),
                    email: row.email,
                    phone: row.phone,
                });
            })
            .on('end', () => {
                resolve(stations);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

/**
 * Find the nearest police station to given coordinates
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @returns {Promise<Object>} Nearest police station with distance
 */
async function findNearestPoliceStation(userLat, userLon) {
    try {
        const stations = await loadPoliceStations();

        let nearestStation = null;
        let minDistance = Infinity;

        for (const station of stations) {
            const distance = calculateDistance(
                userLat,
                userLon,
                station.latitude,
                station.longitude
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearestStation = {
                    ...station,
                    distance: distance,
                    distanceKm: (distance / 1000).toFixed(2),
                };
            }
        }

        return nearestStation;
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
        const stations = await loadPoliceStations();

        const stationsWithDistance = stations.map((station) => {
            const distance = calculateDistance(
                userLat,
                userLon,
                station.latitude,
                station.longitude
            );

            return {
                ...station,
                distance: distance,
                distanceKm: (distance / 1000).toFixed(2),
            };
        });

        // Sort by distance and return top N
        return stationsWithDistance
            .sort((a, b) => a.distance - b.distance)
            .slice(0, count);
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
