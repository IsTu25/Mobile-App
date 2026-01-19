const express = require('express');
const router = express.Router();
const { findNearestPoliceStation, findNearestPoliceStations } = require('../utils/policeStationFinder');

/**
 * @route   GET /api/police/nearest
 * @desc    Get nearest police station based on lat/lon
 * @access  Public
 */
router.get('/nearest', async (req, res) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                success: false,
                message: 'Please provide latitude and longitude'
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates'
            });
        }

        const nearestStation = await findNearestPoliceStation(latitude, longitude);

        if (!nearestStation) {
            return res.status(404).json({
                success: false,
                message: 'No police station found'
            });
        }

        res.json({
            success: true,
            data: nearestStation
        });

    } catch (error) {
        console.error('Error in police API:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

module.exports = router;
