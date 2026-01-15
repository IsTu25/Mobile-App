const mongoose = require('mongoose');

const trackingSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    active: {
        type: Boolean,
        default: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    currentLocation: {
        latitude: Number,
        longitude: Number,
        heading: Number,
        speed: Number, // m/s
        accuracy: Number,
        timestamp: Date
    },
    path: [{
        latitude: Number,
        longitude: Number,
        timestamp: Date
    }]
}, {
    timestamps: true
});

// Index for finding active sessions quickly
trackingSessionSchema.index({ user: 1, active: 1 });

module.exports = mongoose.model('TrackingSession', trackingSessionSchema);
