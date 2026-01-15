const mongoose = require('mongoose');

const crimeReportSchema = new mongoose.Schema({
    reportId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },

    userId: {
        type: String,
        ref: 'User',
        required: true
    },

    category: {
        type: String,
        required: true,
        enum: [
            'Theft/Robbery',
            'Assault',
            'Harassment',
            'Vandalism',
            'Drug Activity',
            'Traffic Violation',
            'Fraud/Scam',
            'Domestic Violence',
            'Other'
        ]
    },

    title: {
        type: String,
        required: true,
        maxLength: 200
    },

    description: {
        type: String,
        required: true,
        maxLength: 2000
    },

    // Location where incident occurred
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },

    address: {
        type: String
    },

    incidentDate: {
        type: Date,
        required: true
    },

    // Evidence files (photos/videos)
    evidenceFiles: [{
        url: String,
        type: {
            type: String,
            enum: ['image', 'video']
        },
        filename: String
    }],

    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending'
    },

    isAnonymous: {
        type: Boolean,
        default: false
    },

    // Admin/Moderator notes
    adminNotes: String,

    reviewedAt: Date,
    reviewedBy: String

}, {
    timestamps: true
});

// Geospatial index for location queries
crimeReportSchema.index({ location: '2dsphere' });

// Index for efficient querying
crimeReportSchema.index({ userId: 1, createdAt: -1 });
crimeReportSchema.index({ status: 1 });
crimeReportSchema.index({ category: 1 });

module.exports = mongoose.model('CrimeReport', crimeReportSchema);
