const mongoose = require('mongoose');

const policeStationSchema = new mongoose.Schema({
  stationId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  name: {
    type: String,
    required: true
  },
  
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
  
  // Contact
  phone: String,
  emergencyHotline: String,
  email: String,
  
  // Coverage Area (optional GeoJSON polygon)
  jurisdictionArea: {
    type: {
      type: String,
      enum: ['Polygon']
    },
    coordinates: {
      type: [[[Number]]] // GeoJSON polygon format
    }
  },
  
  // Integration
  apiEndpoint: String,
  acceptsDigitalAlerts: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
  
}, {
  timestamps: true
});

// Geospatial index for finding nearest stations
policeStationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('PoliceStation', policeStationSchema);
