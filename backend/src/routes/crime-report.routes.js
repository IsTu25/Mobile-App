const express = require('express');
const router = express.Router();
const CrimeReport = require('../models/CrimeReport');
const { authenticateToken } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

/**
 * Submit a crime report
 * Accepts multiple file uploads for evidence
 */
router.post('/submit', authenticateToken, upload.array('evidence', 5), async (req, res, next) => {
    try {
        const { category, title, description, latitude, longitude, address, incidentDate, isAnonymous } = req.body;

        // Validate required fields
        if (!category || !title || !description || !latitude || !longitude || !incidentDate) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Generate unique report ID
        const reportId = `REPORT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Process uploaded evidence files
        const evidenceFiles = req.files ? req.files.map(file => ({
            url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
            type: file.mimetype.startsWith('image/') ? 'image' : 'video',
            filename: file.filename
        })) : [];

        // Create crime report
        const crimeReport = new CrimeReport({
            reportId,
            userId: req.user.userId,
            category,
            title,
            description,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            address,
            incidentDate: new Date(incidentDate),
            evidenceFiles,
            isAnonymous: isAnonymous === 'true' || isAnonymous === true
        });

        await crimeReport.save();

        console.log(`📋 Crime report submitted: ${reportId} by ${req.user.userId}`);

        res.status(201).json({
            success: true,
            message: 'Crime report submitted successfully',
            data: {
                reportId: crimeReport.reportId,
                category: crimeReport.category,
                status: crimeReport.status
            }
        });

    } catch (error) {
        console.error('Crime report submission error:', error);
        next(error);
    }
});

/**
 * Get user's submitted reports
 */
router.get('/my-reports', authenticateToken, async (req, res, next) => {
    try {
        const reports = await CrimeReport.find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .select('-adminNotes -reviewedBy');

        res.status(200).json({
            success: true,
            data: reports
        });

    } catch (error) {
        next(error);
    }
});

/**
 * Get specific report details
 */
router.get('/:reportId', authenticateToken, async (req, res, next) => {
    try {
        const report = await CrimeReport.findOne({ reportId: req.params.reportId });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Only allow user to view their own report (unless admin - future feature)
        if (report.userId !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.status(200).json({
            success: true,
            data: report
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
