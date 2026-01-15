const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },

  // Authentication (Phone OTP only)
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  countryCode: {
    type: String,
    default: '+880' // Bangladesh
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  password: {
    type: String,
    select: false
  },

  isEmailVerified: {
    type: Boolean,
    default: false
  },

  // Profile
  fullName: {
    type: String,
    required: true
  },

  email: {
    type: String,
    sparse: true
  },

  profilePhoto: {
    type: String
  },

  // Extended Profile
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },

  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },

  dateOfBirth: {
    type: Date
  },

  address: {
    type: String
  },

  medicalCondition: {
    type: String,
    maxLength: 500
  },

  // App Security (PIN/Password)
  appSecurity: {
    enabled: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: ['pin', 'password'],
      default: 'pin'
    },
    hashedSecret: {
      type: String,
      select: false // Don't include in queries by default
    }
  },

  // Emergency Contacts
  emergencyContacts: [{
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    relationship: String
  }],

  // Location (2dsphere index for geospatial queries)
  lastKnownLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },

  // Settings
  settings: {
    receiveNearbyAlerts: {
      type: Boolean,
      default: true
    },
    alertRadius: {
      type: Number,
      default: 500 // meters
    },
    shareLocationWithContacts: {
      type: Boolean,
      default: true
    }
  },

  // Firebase Token for push notifications
  fcmToken: String,

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Refresh Token
  refreshToken: {
    type: String,
    select: false
  }

}, {
  timestamps: true
});

// Indexes
userSchema.index({ lastKnownLocation: '2dsphere' });

// Hash app security secret and password before saving
userSchema.pre('save', async function (next) {
  if (this.appSecurity.enabled && this.isModified('appSecurity.hashedSecret')) {
    const salt = await bcrypt.genSalt(10);
    this.appSecurity.hashedSecret = await bcrypt.hash(
      this.appSecurity.hashedSecret,
      salt
    );
  }

  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to compare app security secret
userSchema.methods.compareAppSecret = async function (secret) {
  return await bcrypt.compare(secret, this.appSecurity.hashedSecret);
};

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
