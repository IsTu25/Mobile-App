const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  // User Info
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userName: String,
  userPhone: String,
  
  // Location (2dsphere for geospatial queries)
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
  address: String,
  
  // Alert Details
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'responded', 'resolved', 'cancelled'],
    default: 'active',
    index: true
  },
  triggerMethod: {
    type: String,
    enum: ['button', 'gesture'],
    default: 'button'
  },
  
  // Notifications Sent
  notifiedPoliceStations: [{
    stationId: mongoose.Schema.Types.ObjectId,
    stationName: String,
    distance: Number,
    notifiedAt: Date
  }],
  
  notifiedContacts: [{
    contactName: String,
    contactPhone: String,
    notifiedAt: Date,
    deliveryStatus: String
  }],
  
  notifiedNearbyUsers: [{
    userId: mongoose.Schema.Types.ObjectId,
    distance: Number,
    notifiedAt: Date
  }],
  
  // Live Tracking
  locationUpdates: [{
    coordinates: [Number], // [longitude, latitude]
    timestamp: {
      type: Date,
      default: Date.now
    },
    accuracy: Number
  }],
  
  // Response
  respondedBy: String, // Police officer ID or username
  respondedAt: Date,
  responseNotes: String,
  
  resolvedAt: Date
  
}, {
  timestamps: true
});

// Indexes
sosAlertSchema.index({ location: '2dsphere' });
sosAlertSchema.index({ userId: 1, createdAt: -1 });
sosAlertSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SOSAlert', sosAlertSchema);
