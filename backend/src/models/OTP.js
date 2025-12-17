const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    sparse: true,
    index: true
  },
  
  email: {
    type: String,
    sparse: true,
    index: true
  },
  
  type: {
    type: String,
    enum: ['phone', 'email'],
    default: 'phone',
    required: true
  },
  
  otp: {
    type: String,
    required: true
  },
  
  attempts: {
    type: Number,
    default: 0
  },
  
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index - auto-delete after expiry
  },
  
  isUsed: {
    type: Boolean,
    default: false
  }
  
}, {
  timestamps: true
});

// Compound index to prevent multiple active OTPs
otpSchema.index({ phoneNumber: 1, type: 1, isUsed: 1 });
otpSchema.index({ email: 1, type: 1, isUsed: 1 });

module.exports = mongoose.model('OTP', otpSchema);
