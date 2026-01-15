const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const fs = require('fs');
const path = require('path');

// Get User Profile
router.get('/profile', authenticateToken, async (req, res, next) => {
    try {
        const user = await User.findOne({ userId: req.user.userId });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// Update Profile Text Fields
router.put('/profile', authenticateToken, async (req, res, next) => {
    try {
        const { fullName, email, bloodGroup, gender, dateOfBirth, address, medicalCondition } = req.body;

        // Whitelist allowed updates
        const updates = {};
        if (fullName) updates.fullName = fullName;
        if (email) updates.email = email;
        if (bloodGroup) updates.bloodGroup = bloodGroup;
        if (gender) updates.gender = gender;
        if (dateOfBirth) updates.dateOfBirth = dateOfBirth;
        if (address) updates.address = address;
        if (medicalCondition) updates.medicalCondition = medicalCondition;

        const user = await User.findOneAndUpdate(
            { userId: req.user.userId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// Upload/Update Profile Photo
router.post('/profile/photo', authenticateToken, upload.single('photo'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No photo provided' });
        }

        // Construct local file URL
        // Assumes 'uploads' is served statically
        const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        const user = await User.findOneAndUpdate(
            { userId: req.user.userId },
            { $set: { profilePhoto: photoUrl } },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Profile photo updated',
            data: {
                profilePhoto: photoUrl
            }
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
