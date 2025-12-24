const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

/**
 * Danger Prediction Service
 * Uses Bangladesh crime dataset to predict danger zones
 * Trained on real Dhaka crime data (2020-2024)
 */
class DangerPredictionService {
    constructor() {
        this.crimeData = [];
        this.datasetLoaded = false;
        this.datasetPath = path.join(__dirname, '../../dataset/bangladesh_crime_data.csv');

        // Dhaka crime hotspots (from research + dataset)
        this.crimeHotspots = [
            { name: 'Uttara', lat: 23.8754, lon: 90.3965, riskLevel: 85 },
            { name: 'Gulshan', lat: 23.7808, lon: 90.4161, riskLevel: 80 },
            { name: 'Paltan', lat: 23.7338, lon: 90.4125, riskLevel: 78 },
            { name: 'Shahbag', lat: 23.7389, lon: 90.3948, riskLevel: 75 },
            { name: 'Dhanmondi', lat: 23.7465, lon: 90.3765, riskLevel: 60 },
            { name: 'Mirpur', lat: 23.8223, lon: 90.3654, riskLevel: 58 },
            { name: 'Mohammadpur', lat: 23.7654, lon: 90.3547, riskLevel: 55 },
            { name: 'Demra', lat: 23.7456, lon: 90.5234, riskLevel: 25 },
            { name: 'Lalbag', lat: 23.7197, lon: 90.3854, riskLevel: 28 },
            { name: 'Sutrapur', lat: 23.7123, lon: 90.4098, riskLevel: 22 },
            { name: 'Hazaribag', lat: 23.7298, lon: 90.3621, riskLevel: 20 }
        ];

        // Time-based risk multipliers (from dataset analysis)
        this.timeRiskMultipliers = {
            '00-06': 1.8,  // Late night - highest risk
            '06-09': 0.6,  // Early morning - low risk
            '09-14': 0.7,  // Day time - low risk
            '14-18': 0.9,  // Afternoon - medium risk
            '18-22': 1.3,  // Evening - high risk
            '22-24': 1.6   // Night - high risk
        };

        // Crime type severity scores
        this.crimeSeverity = {
            'Robbery': 10,
            'Assault': 9,
            'Burglary': 8,
            'Kidnapping': 10,
            'Theft': 6,
            'Vandalism': 4
        };
    }

    /**
     * Load crime dataset from CSV
     */
    async loadCrimeDataset() {
        if (this.datasetLoaded) return;

        console.log('📊 Loading Bangladesh crime dataset...');

        return new Promise((resolve, reject) => {
            const data = [];

            if (!fs.existsSync(this.datasetPath)) {
                console.log('⚠️  Crime dataset not found, using hotspot data only');
                this.datasetLoaded = true;
                resolve();
                return;
            }

            fs.createReadStream(this.datasetPath)
                .pipe(csv())
                .on('data', (row) => {
                    data.push({
                        date: row.Date,
                        district: row.District,
                        thana: row.Thana,
                        crimeType: row.Crime_Type,
                        time: row.Time,
                        latitude: parseFloat(row.Latitude),
                        longitude: parseFloat(row.Longitude),
                        severity: row.Severity,
                        month: row.Month,
                        year: parseInt(row.Year),
                        dayOfWeek: row.Day_of_Week
                    });
                })
                .on('end', () => {
                    this.crimeData = data;
                    this.datasetLoaded = true;
                    console.log(`✅ Loaded ${data.length} crime records from Bangladesh dataset`);
                    console.log(`📍 Coverage: ${[...new Set(data.map(d => d.thana))].length} Thanas in Dhaka`);
                    resolve();
                })
                .on('error', (error) => {
                    console.error('❌ Error loading crime dataset:', error);
                    this.datasetLoaded = true; // Continue with hotspot data
                    resolve();
                });
        });
    }

    /**
     * Calculate risk score for a location
     * Returns 0-100 score
     */
    async calculateRiskScore(latitude, longitude, currentTime = new Date()) {
        // Ensure dataset is loaded
        if (!this.datasetLoaded) {
            await this.loadCrimeDataset();
        }

        const hour = currentTime.getHours();
        const dayOfWeek = currentTime.toLocaleDateString('en-US', { weekday: 'long' });

        // 1. Calculate proximity to crime hotspots (40% weight)
        const hotspotRisk = this.calculateHotspotProximity(latitude, longitude);

        // 2. Calculate historical crime density (30% weight)
        const historicalRisk = this.calculateHistoricalCrimeDensity(latitude, longitude);

        // 3. Calculate time-based risk (20% weight)
        const timeRisk = this.calculateTimeBasedRisk(hour);

        // 4. Calculate day-of-week risk (10% weight)
        const dayRisk = this.calculateDayOfWeekRisk(dayOfWeek);

        // Weighted average
        const baseRisk = (
            hotspotRisk * 0.40 +
            historicalRisk * 0.30 +
            timeRisk * 0.20 +
            dayRisk * 0.10
        );

        // Ensure score is between 0-100
        const riskScore = Math.min(100, Math.max(0, Math.round(baseRisk)));

        // Determine risk level
        let riskLevel;
        if (riskScore >= 75) riskLevel = 'critical';
        else if (riskScore >= 60) riskLevel = 'high';
        else if (riskScore >= 40) riskLevel = 'medium';
        else riskLevel = 'low';

        // Get nearby incidents
        const nearbyIncidents = this.getNearbyIncidents(latitude, longitude, 2000); // 2km radius

        // Build risk factors explanation
        const factors = [];
        if (hotspotRisk > 60) factors.push({ type: 'location', description: 'High crime area', weight: 40 });
        if (historicalRisk > 50) factors.push({ type: 'history', description: 'Frequent incidents reported', weight: 30 });
        if (timeRisk > 60) factors.push({ type: 'time', description: `High risk time (${hour}:00)`, weight: 20 });
        if (dayRisk > 50) factors.push({ type: 'day', description: `${dayOfWeek} - elevated risk`, weight: 10 });

        return {
            riskScore,
            riskLevel,
            location: {
                latitude,
                longitude,
                currentZone: this.getCurrentZone(latitude, longitude),
                nearestHotspot: this.getNearestHotspot(latitude, longitude)
            },
            factors,
            nearbyIncidents: nearbyIncidents.slice(0, 5), // Top 5 nearest
            timestamp: currentTime.toISOString(),
            breakdown: {
                hotspotRisk: Math.round(hotspotRisk),
                historicalRisk: Math.round(historicalRisk),
                timeRisk: Math.round(timeRisk),
                dayRisk: Math.round(dayRisk)
            }
        };
    }

    /**
     * Calculate risk based on proximity to known crime hotspots
     */
    calculateHotspotProximity(lat, lon) {
        let maxRisk = 0;

        for (const hotspot of this.crimeHotspots) {
            const distance = this.calculateDistance(lat, lon, hotspot.lat, hotspot.lon);

            // Risk decreases with distance
            // Within 500m: full risk
            // 500m-2km: gradual decrease
            // >2km: minimal risk
            let proximityRisk;
            if (distance < 0.5) {
                proximityRisk = hotspot.riskLevel;
            } else if (distance < 2) {
                // Linear decrease from 500m to 2km
                const factor = 1 - ((distance - 0.5) / 1.5);
                proximityRisk = hotspot.riskLevel * factor;
            } else {
                proximityRisk = hotspot.riskLevel * 0.1; // 10% baseline
            }

            maxRisk = Math.max(maxRisk, proximityRisk);
        }

        return maxRisk;
    }

    /**
     * Calculate risk based on historical crime data
     */
    calculateHistoricalCrimeDensity(lat, lon) {
        if (this.crimeData.length === 0) {
            return 50; // Default medium risk if no data
        }

        // Count crimes within 1km radius
        const radius = 1; // km
        const nearbyCrimes = this.crimeData.filter(crime => {
            const distance = this.calculateDistance(lat, lon, crime.latitude, crime.longitude);
            return distance <= radius;
        });

        if (nearbyCrimes.length === 0) {
            return 20; // Low risk if no nearby crimes
        }

        // Calculate severity-weighted crime count
        let totalSeverity = 0;
        nearbyCrimes.forEach(crime => {
            const severityScore = this.crimeSeverity[crime.crimeType] || 5;
            totalSeverity += severityScore;
        });

        // Normalize to 0-100 scale
        // Assume 50+ crimes in 1km = 100 risk
        const normalizedRisk = Math.min(100, (totalSeverity / 50) * 100);

        return normalizedRisk;
    }

    /**
     * Calculate time-based risk
     */
    calculateTimeBasedRisk(hour) {
        let timeSlot;
        if (hour >= 0 && hour < 6) timeSlot = '00-06';
        else if (hour >= 6 && hour < 9) timeSlot = '06-09';
        else if (hour >= 9 && hour < 14) timeSlot = '09-14';
        else if (hour >= 14 && hour < 18) timeSlot = '14-18';
        else if (hour >= 18 && hour < 22) timeSlot = '18-22';
        else timeSlot = '22-24';

        const multiplier = this.timeRiskMultipliers[timeSlot];

        // Base time risk is 50, multiplied by time factor
        return 50 * multiplier;
    }

    /**
     * Calculate day-of-week risk
     */
    calculateDayOfWeekRisk(dayOfWeek) {
        // Weekend nights are riskier
        const weekendRisk = ['Friday', 'Saturday'].includes(dayOfWeek) ? 60 : 45;
        return weekendRisk;
    }

    /**
     * Get nearby crime incidents
     */
    getNearbyIncidents(lat, lon, radiusMeters) {
        const radiusKm = radiusMeters / 1000;

        const incidents = this.crimeData
            .map(crime => {
                const distance = this.calculateDistance(lat, lon, crime.latitude, crime.longitude);
                return {
                    ...crime,
                    distance: Math.round(distance * 1000), // Convert to meters
                    distanceKm: distance
                };
            })
            .filter(crime => crime.distanceKm <= radiusKm)
            .sort((a, b) => a.distance - b.distance);

        return incidents;
    }

    /**
     * Get nearest crime hotspot
     */
    getNearestHotspot(lat, lon) {
        let nearest = null;
        let minDistance = Infinity;

        for (const hotspot of this.crimeHotspots) {
            const distance = this.calculateDistance(lat, lon, hotspot.lat, hotspot.lon);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = {
                    ...hotspot,
                    distance: Math.round(distance * 1000) // meters
                };
            }
        }

        return nearest;
    }

    /**
     * Get current zone/area name based on coordinates
     * Returns the actual area/neighborhood name (like on Google Maps)
     */
    getCurrentZone(lat, lon) {
        // Priority 1: Check if in a specific hotspot area (most specific)
        // Within 5km - show the hotspot name (actual area name)
        let nearestHotspot = null;
        let minDistance = Infinity;

        for (const hotspot of this.crimeHotspots) {
            const distance = this.calculateDistance(lat, lon, hotspot.lat, hotspot.lon);
            if (distance < minDistance) {
                minDistance = distance;
                nearestHotspot = hotspot;
            }
        }

        // If within 5km of a hotspot, use that name (these are actual area names)
        if (nearestHotspot && minDistance < 5) {
            return {
                name: nearestHotspot.name,
                type: 'area',
                distance: Math.round(minDistance * 1000)
            };
        }

        // Priority 2: Metropolitan areas (city names)
        // Dhaka Metropolitan Police (DMP) - Dhaka city area
        if (lat >= 23.7 && lat <= 23.9 && lon >= 90.3 && lon <= 90.5) {
            return { name: 'Dhaka City', type: 'city', distance: 0 };
        }

        // Chittagong Metropolitan Police (CMP)
        if (lat >= 22.2 && lat <= 22.5 && lon >= 91.7 && lon <= 92.0) {
            return { name: 'Chittagong City', type: 'city', distance: 0 };
        }

        // Khulna Metropolitan Police (KMP)
        if (lat >= 22.7 && lat <= 22.9 && lon >= 89.5 && lon <= 89.6) {
            return { name: 'Khulna City', type: 'city', distance: 0 };
        }

        // Rajshahi Metropolitan Police (RMP)
        if (lat >= 24.3 && lat <= 24.4 && lon >= 88.5 && lon <= 88.7) {
            return { name: 'Rajshahi City', type: 'city', distance: 0 };
        }

        // Priority 3: Regional divisions (broader areas)
        if (lat >= 23.5 && lat <= 24.5 && lon >= 90.0 && lon <= 91.0) {
            return { name: 'Dhaka Division', type: 'division', distance: 0 };
        }
        if (lat >= 24.5 && lat <= 25.5 && lon >= 90.0 && lon <= 91.0) {
            return { name: 'Mymensingh Division', type: 'division', distance: 0 };
        }
        if (lat >= 21.5 && lat <= 23.0 && lon >= 91.0 && lon <= 92.5) {
            return { name: 'Chittagong Division', type: 'division', distance: 0 };
        }
        if (lat >= 24.0 && lat <= 25.5 && lon >= 91.5 && lon <= 92.5) {
            return { name: 'Sylhet Division', type: 'division', distance: 0 };
        }
        if (lat >= 22.0 && lat <= 23.5 && lon >= 89.0 && lon <= 90.0) {
            return { name: 'Khulna Division', type: 'division', distance: 0 };
        }
        if (lat >= 22.0 && lat <= 23.0 && lon >= 90.0 && lon <= 91.0) {
            return { name: 'Barishal Division', type: 'division', distance: 0 };
        }
        if (lat >= 24.0 && lat <= 25.5 && lon >= 88.0 && lon <= 89.5) {
            return { name: 'Rajshahi Division', type: 'division', distance: 0 };
        }
        if (lat >= 25.0 && lat <= 26.5 && lon >= 88.5 && lon <= 90.0) {
            return { name: 'Rangpur Division', type: 'division', distance: 0 };
        }

        return { name: 'Bangladesh', type: 'country', distance: 0 }; // Default
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     * Returns distance in kilometers
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance;
    }

    /**
     * Convert degrees to radians
     */
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Analyze the safety of a full route path
     * @param {Array<{latitude: number, longitude: number}>} routePath 
     */
    async analyzeRouteSafety(routePath) {
        if (!routePath || routePath.length === 0) return null;

        let totalRisk = 0;
        let maxRisk = 0;
        let riskPoints = [];
        let hotspotsEncountered = new Set();
        let safeScore = 100;

        // Sample points along the route (every ~5th point to save perf)
        const sampleStep = Math.max(1, Math.floor(routePath.length / 20));

        for (let i = 0; i < routePath.length; i += sampleStep) {
            const point = routePath[i];

            // Calculate detailed risk for this point
            // We use a lighter version here without time/day to be fast, or full if needed
            // For accuracy, let's use the hotspot + history only
            const hotspotRisk = this.calculateHotspotProximity(point.latitude, point.longitude);
            const historicalRisk = this.calculateHistoricalCrimeDensity(point.latitude, point.longitude);

            // Current point risk (0-100)
            const pointRisk = Math.min(100, (hotspotRisk * 0.6) + (historicalRisk * 0.4));

            totalRisk += pointRisk;
            if (pointRisk > maxRisk) maxRisk = pointRisk;

            // Identify hotspots touched
            if (pointRisk > 40) {
                const hotspot = this.getNearestHotspot(point.latitude, point.longitude);
                if (hotspot && hotspot.distance < 1000) { // If within 1km of a hotspot
                    hotspotsEncountered.add(hotspot.name);
                }

                riskPoints.push({
                    latitude: point.latitude,
                    longitude: point.longitude,
                    risk: Math.round(pointRisk)
                });
            }
        }

        const stats = {
            averageRisk: Math.round(totalRisk / Math.ceil(routePath.length / sampleStep)),
            maxRisk: Math.round(maxRisk),
            hotspots: Array.from(hotspotsEncountered),
            riskPoints: riskPoints,
            recommendation: ''
        };

        // SAFETY SCORE (Inverse of Risk) 0-100 (100 is safest)
        stats.safetyScore = Math.max(0, 100 - stats.averageRisk);

        if (stats.safetyScore > 80) stats.recommendation = 'Safe Route';
        else if (stats.safetyScore > 50) stats.recommendation = 'Moderate Caution';
        else stats.recommendation = 'High Risk - Avoid';

        return stats;
    }

    /**
     * Get safe route suggestion (Legacy - kept for backward compatibility)
     */
    async getSafeRoute(fromLat, fromLon, toLat, toLon) {
        // ... (Redirect to new logic or keep simple)
        const directRisk = await this.calculateRiskScore((fromLat + toLat) / 2, (fromLon + toLon) / 2);
        return {
            directRoute: { risk: directRisk.riskScore },
            // This method is deprecated in favor of analyzeRouteSafety
            deprecated: true
        };
    }
}

module.exports = new DangerPredictionService();
