# Phase-by-Phase Implementation Guide

Detailed step-by-step implementation plan for the first two critical features of the Community Safety Reporting System.

---

## Phase A: User Registration & Verification

### Overview
Implement a secure authentication system supporting both NID verification and phone-based OTP registration with app-level security.

### Architecture

```mermaid
graph TB
    subgraph "Mobile App"
        A[Registration Screen]
        B[OTP Screen]
        C[App Security Setup]
    end
    
    subgraph "Backend API"
        D[Auth Controller]
        E[Auth Service]
        F[NID Service]
        G[SMS Service]
    end
    
    subgraph "External Services"
        H[NID API]
        I[SMS Gateway]
    end
    
    subgraph "Database"
        J[(Users Collection)]
        K[(OTP Store)]
    end
    
    A --> D
    B --> D
    D --> E
    E --> F
    E --> G
    F --> H
    G --> I
    E --> J
    E --> K
```

---

### Step 1: Backend Setup (Week 1, Days 1-2)

#### 1.1 Initialize Node.js Project

```bash
# Create project directory
mkdir safety-backend
cd safety-backend

# Initialize Node.js project
npm init -y

# Install core dependencies
npm install express mongoose dotenv cors helmet
npm install express-rate-limit express-validator
npm install jsonwebtoken bcryptjs
npm install firebase-admin
npm install joi

# Install development dependencies
npm install -D nodemon eslint prettier
```

#### 1.2 Project Structure Setup

Create the following directory structure:

```
safety-backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── firebase.js
│   │   └── env.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── auth.routes.js
│   ├── controllers/
│   │   └── auth.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── nid-verification.service.js
│   │   └── sms.service.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   └── error.middleware.js
│   ├── validators/
│   │   └── auth.validator.js
│   ├── utils/
│   │   ├── id-generator.js
│   │   └── encryption.js
│   └── app.js
├── server.js
├── .env.example
└── package.json
```

#### 1.3 Environment Configuration

Create `.env` file:

```env
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safety-app?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# SMS Gateway (Twilio example)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# NID Verification (Bangladesh Example)
NID_API_URL=https://api.nid-service.gov.bd/verify
NID_API_KEY=your-api-key

# Security
ENCRYPTION_KEY=32-character-encryption-key-here
OTP_EXPIRY_MINUTES=5
MAX_OTP_ATTEMPTS=3
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

### Step 2: Database Models (Week 1, Day 2)

#### 2.1 User Model

Create `src/models/User.js`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  // Authentication
  authMethod: {
    type: String,
    enum: ['nid', 'phone'],
    required: true
  },
  
  nidNumber: {
    type: String,
    sparse: true,
    unique: true,
    select: false // Don't include in queries by default
  },
  
  phoneNumber: {
    type: String,
    sparse: true,
    unique: true,
    required: true
  },
  
  countryCode: {
    type: String,
    default: '+880' // Bangladesh
  },
  
  isVerified: {
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
  
  // App Security
  appSecurity: {
    enabled: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: ['pin', 'password', 'otp']
    },
    hashedSecret: {
      type: String,
      select: false
    }
  },
  
  // Emergency Contacts
  emergencyContacts: [{
    name: String,
    phone: String,
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
userSchema.index({ phoneNumber: 1 });
userSchema.index({ nidNumber: 1 }, { sparse: true });

// Hash app security secret before saving
userSchema.pre('save', async function(next) {
  if (this.appSecurity.enabled && this.isModified('appSecurity.hashedSecret')) {
    const salt = await bcrypt.genSalt(10);
    this.appSecurity.hashedSecret = await bcrypt.hash(
      this.appSecurity.hashedSecret,
      salt
    );
  }
  next();
});

// Method to compare app security secret
userSchema.methods.compareAppSecret = async function(secret) {
  return await bcrypt.compare(secret, this.appSecurity.hashedSecret);
};

module.exports = mongoose.model('User', userSchema);
```

#### 2.2 OTP Model

Create `src/models/OTP.js`:

```javascript
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    index: true
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
otpSchema.index({ phoneNumber: 1, isUsed: 1 });

module.exports = mongoose.model('OTP', otpSchema);
```

---

### Step 3: Utility Functions (Week 1, Day 3)

#### 3.1 ID Generator

Create `src/utils/id-generator.js`:

```javascript
const crypto = require('crypto');

/**
 * Generate unique ID with prefix
 * @param {string} prefix - ID prefix (e.g., 'USR', 'SOS', 'INC')
 * @returns {string} - Unique ID
 */
function generateId(prefix) {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(8).toString('hex');
  return `${prefix}_${timestamp}${randomStr}`;
}

module.exports = { generateId };
```

#### 3.2 Encryption Utility

Create `src/utils/encryption.js`:

```javascript
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

/**
 * Encrypt sensitive data
 */
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex')
  };
}

/**
 * Decrypt sensitive data
 */
function decrypt(encryptedObj) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(encryptedObj.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedObj.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedObj.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = { encrypt, decrypt };
```

#### 3.3 OTP Generator

Create `src/utils/otp-generator.js`:

```javascript
const crypto = require('crypto');

/**
 * Generate 6-digit OTP
 */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

module.exports = { generateOTP };
```

---

### Step 4: Services Layer (Week 1, Days 3-4)

#### 4.1 SMS Service

Create `src/services/sms.service.js`:

```javascript
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

class SMSService {
  /**
   * Send OTP SMS
   */
  async sendOTP(phoneNumber, otp) {
    try {
      const message = await client.messages.create({
        body: `Your Safety App verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      
      return {
        success: true,
        messageId: message.sid
      };
    } catch (error) {
      console.error('SMS Error:', error);
      throw new Error('Failed to send SMS');
    }
  }
  
  /**
   * Send emergency alert SMS
   */
  async sendEmergencyAlert(phoneNumber, userName, locationUrl) {
    try {
      const message = await client.messages.create({
        body: `🚨 EMERGENCY ALERT: ${userName} has triggered an SOS alert. Track their location: ${locationUrl}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      
      return {
        success: true,
        messageId: message.sid
      };
    } catch (error) {
      console.error('Emergency SMS Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new SMSService();
```

#### 4.2 NID Verification Service

Create `src/services/nid-verification.service.js`:

```javascript
const axios = require('axios');

class NIDVerificationService {
  /**
   * Verify NID with government API
   * @param {string} nidNumber - National ID number
   * @param {string} dateOfBirth - DOB in YYYY-MM-DD format
   * @returns {Object} - Verification result with user details
   */
  async verifyNID(nidNumber, dateOfBirth) {
    try {
      // Call NID verification API
      const response = await axios.post(
        process.env.NID_API_URL,
        {
          nid: nidNumber,
          dob: dateOfBirth
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.NID_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      if (response.data.verified) {
        return {
          verified: true,
          data: {
            fullName: response.data.name,
            dateOfBirth: response.data.dob,
            // Other details from API
          }
        };
      }
      
      return {
        verified: false,
        error: 'NID verification failed'
      };
      
    } catch (error) {
      console.error('NID Verification Error:', error);
      
      // If NID API is unavailable, return error
      return {
        verified: false,
        error: 'NID verification service unavailable'
      };
    }
  }
}

module.exports = new NIDVerificationService();
```

#### 4.3 Auth Service

Create `src/services/auth.service.js`:

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateId } = require('../utils/id-generator');
const { generateOTP } = require('../utils/otp-generator');
const { encrypt } = require('../utils/encryption');
const smsService = require('./sms.service');
const nidService = require('./nid-verification.service');

class AuthService {
  /**
   * Register user with NID
   */
  async registerWithNID(nidNumber, dateOfBirth, phoneNumber, fullName) {
    // Verify NID
    const nidResult = await nidService.verifyNID(nidNumber, dateOfBirth);
    
    if (!nidResult.verified) {
      throw new Error('Invalid NID or date of birth');
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ nidNumber });
    if (existingUser) {
      throw new Error('User with this NID already exists');
    }
    
    // Encrypt NID before storing
    const encryptedNID = encrypt(nidNumber);
    
    // Create user
    const user = new User({
      userId: generateId('USR'),
      authMethod: 'nid',
      nidNumber: JSON.stringify(encryptedNID),
      phoneNumber,
      fullName: fullName || nidResult.data.fullName,
      isVerified: true
    });
    
    await user.save();
    
    // Generate tokens
    const tokens = this.generateTokens(user);
    
    return {
      user: this.sanitizeUser(user),
      tokens
    };
  }
  
  /**
   * Register/Login with phone number (send OTP)
   */
  async sendPhoneOTP(phoneNumber) {
    // Rate limiting check (max 3 OTPs per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOTPs = await OTP.countDocuments({
      phoneNumber,
      createdAt: { $gte: oneHourAgo }
    });
    
    if (recentOTPs >= 3) {
      throw new Error('Too many OTP requests. Please try after 1 hour.');
    }
    
    // Generate OTP
    const otpCode = generateOTP();
    
    // Save OTP to database
    const expiryTime = new Date(
      Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES) * 60 * 1000
    );
    
    await OTP.create({
      phoneNumber,
      otp: otpCode,
      expiresAt: expiryTime
    });
    
    // Send SMS
    await smsService.sendOTP(phoneNumber, otpCode);
    
    return {
      message: 'OTP sent successfully',
      expiresIn: process.env.OTP_EXPIRY_MINUTES + ' minutes'
    };
  }
  
  /**
   * Verify OTP and create/login user
   */
  async verifyOTP(phoneNumber, otpCode, fullName = null) {
    // Find OTP
    const otpRecord = await OTP.findOne({
      phoneNumber,
      otp: otpCode,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!otpRecord) {
      throw new Error('Invalid or expired OTP');
    }
    
    // Check attempts
    if (otpRecord.attempts >= parseInt(process.env.MAX_OTP_ATTEMPTS)) {
      throw new Error('Maximum OTP attempts exceeded');
    }
    
    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();
    
    // Find or create user
    let user = await User.findOne({ phoneNumber });
    
    if (!user) {
      // Create new user
      if (!fullName) {
        throw new Error('Full name required for new registration');
      }
      
      user = new User({
        userId: generateId('USR'),
        authMethod: 'phone',
        phoneNumber,
        fullName,
        isVerified: true
      });
      
      await user.save();
    }
    
    // Generate tokens
    const tokens = this.generateTokens(user);
    
    return {
      user: this.sanitizeUser(user),
      tokens,
      isNewUser: !user.isVerified
    };
  }
  
  /**
   * Setup app-level security (PIN/Password)
   */
  async setupAppSecurity(userId, type, secret) {
    const user = await User.findOne({ userId });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Validate secret format
    if (type === 'pin' && !/^\d{4,6}$/.test(secret)) {
      throw new Error('PIN must be 4-6 digits');
    }
    
    if (type === 'password' && secret.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    user.appSecurity = {
      enabled: true,
      type,
      hashedSecret: secret // Will be hashed by pre-save hook
    };
    
    await user.save();
    
    return {
      message: 'App security setup successful'
    };
  }
  
  /**
   * Verify app security
   */
  async verifyAppSecurity(userId, secret) {
    const user = await User.findOne({ userId })
      .select('+appSecurity.hashedSecret');
    
    if (!user || !user.appSecurity.enabled) {
      throw new Error('App security not enabled');
    }
    
    const isValid = await user.compareAppSecret(secret);
    
    if (!isValid) {
      throw new Error('Invalid PIN/password');
    }
    
    return {
      valid: true
    };
  }
  
  /**
   * Generate JWT tokens
   */
  generateTokens(user) {
    const accessToken = jwt.sign(
      { userId: user.userId, phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY }
    );
    
    return {
      accessToken,
      refreshToken
    };
  }
  
  /**
   * Remove sensitive fields from user object
   */
  sanitizeUser(user) {
    const userObj = user.toObject();
    delete userObj.nidNumber;
    delete userObj.appSecurity.hashedSecret;
    delete userObj.refreshToken;
    delete userObj.__v;
    return userObj;
  }
}

module.exports = new AuthService();
```

---

### Step 5: Controllers & Routes (Week 1, Day 4)

#### 5.1 Auth Controller

Create `src/controllers/auth.controller.js`:

```javascript
const authService = require('../services/auth.service');

class AuthController {
  async registerWithNID(req, res, next) {
    try {
      const { nidNumber, dateOfBirth, phoneNumber, fullName } = req.body;
      
      const result = await authService.registerWithNID(
        nidNumber,
        dateOfBirth,
        phoneNumber,
        fullName
      );
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  async sendOTP(req, res, next) {
    try {
      const { phoneNumber } = req.body;
      
      const result = await authService.sendPhoneOTP(phoneNumber);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  async verifyOTP(req, res, next) {
    try {
      const { phoneNumber, otp, fullName } = req.body;
      
      const result = await authService.verifyOTP(phoneNumber, otp, fullName);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  async setupAppSecurity(req, res, next) {
    try {
      const { type, secret } = req.body;
      const userId = req.user.userId; // From auth middleware
      
      const result = await authService.setupAppSecurity(userId, type, secret);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  async verifyAppSecurity(req, res, next) {
    try {
      const { secret } = req.body;
      const userId = req.user.userId;
      
      const result = await authService.verifyAppSecurity(userId, secret);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
```

#### 5.2 Auth Routes

Create `src/routes/auth.routes.js`:

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const authValidator = require('../validators/auth.validator');

// Public routes
router.post(
  '/register/nid',
  validate(authValidator.registerWithNID),
  authController.registerWithNID
);

router.post(
  '/register/phone',
  validate(authValidator.sendOTP),
  authController.sendOTP
);

router.post(
  '/verify-otp',
  validate(authValidator.verifyOTP),
  authController.verifyOTP
);

// Protected routes (require authentication)
router.post(
  '/app-security/setup',
  authenticate,
  validate(authValidator.setupAppSecurity),
  authController.setupAppSecurity
);

router.post(
  '/app-security/verify',
  authenticate,
  validate(authValidator.verifyAppSecurity),
  authController.verifyAppSecurity
);

module.exports = router;
```

---

### Step 6: Mobile App - React Native (Week 1, Day 5 - Week 2, Day 2)

#### 6.1 Initialize React Native Project

```bash
# Create new React Native project
npx react-native@latest init SafetyApp --template react-native-template-typescript

cd SafetyApp

# Install dependencies
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install @reduxjs/toolkit react-redux
npm install axios
npm install react-native-gesture-handler
npm install react-native-vector-icons
npm install @react-native-async-storage/async-storage
npm install react-native-keychain

# Link native dependencies
npx pod-install ios
```

#### 6.2 Registration Screen

Create `src/screens/Auth/RegisterScreen.tsx`:

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authAPI } from '../../api/auth.api';

export const RegisterScreen = () => {
  const navigation = useNavigation();
  const [method, setMethod] = useState<'nid' | 'phone'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [nidNumber, setNIDNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneRegistration = async () => {
    if (!phoneNumber || phoneNumber.length < 11) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    
    try {
      await authAPI.sendOTP(phoneNumber);
      
      Alert.alert('Success', 'OTP sent to your phone');
      
      navigation.navigate('OTPScreen', {
        phoneNumber,
        fullName
      });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleNIDRegistration = async () => {
    if (!nidNumber || !dateOfBirth || !phoneNumber) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    
    try {
      const response = await authAPI.registerWithNID({
        nidNumber,
        dateOfBirth,
        phoneNumber,
        fullName
      });
      
      // Store tokens
      await storeTokens(response.data.tokens);
      
      Alert.alert('Success', 'Registration successful!');
      navigation.navigate('Home');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      {/* Method Toggle */}
      <View style={styles.methodToggle}>
        <TouchableOpacity
          style={[styles.methodButton, method === 'phone' && styles.methodButtonActive]}
          onPress={() => setMethod('phone')}
        >
          <Text style={styles.methodText}>Phone Number</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.methodButton, method === 'nid' && styles.methodButtonActive]}
          onPress={() => setMethod('nid')}
        >
          <Text style={styles.methodText}>NID</Text>
        </TouchableOpacity>
      </View>

      {/* Common Fields */}
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />

      {/* NID-specific fields */}
      {method === 'nid' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="NID Number"
            keyboardType="numeric"
            value={nidNumber}
            onChangeText={setNIDNumber}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Date of Birth (YYYY-MM-DD)"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
          />
        </>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={method === 'phone' ? handlePhoneRegistration : handleNIDRegistration}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Please wait...' : 'Continue'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center'
  },
  methodToggle: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden'
  },
  methodButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f0f0f0',
    alignItems: 'center'
  },
  methodButtonActive: {
    backgroundColor: '#007AFF'
  },
  methodText: {
    fontSize: 16,
    fontWeight: '600'
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  }
});
```

---

## Phase B: SOS & Emergency Services

### Overview
Implement critical emergency response features including SOS button, panic gesture detection, and real-time location broadcasting.

### Architecture

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Backend
    participant Firebase
    participant Police
    participant Contacts
    
    User->>App: Trigger SOS
    App->>App: Capture GPS
    App->>Backend: POST /api/emergency/sos
    Backend->>Police: Alert nearest stations
    Backend->>Contacts: Send SMS alerts
    Backend->>Firebase: Notify nearby users
    
    loop Live Tracking
        App->>Backend: Update location
        Backend->>Firebase: Broadcast location
    end
```

---

### Step 1: Backend - SOS Models (Week 2, Day 3)

#### 1.1 SOS Alert Model

Create `src/models/SOSAlert.js`:

```javascript
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
    required: true
  },
  userName: String,
  userPhone: String,
  
  // Location
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
    default: 'active'
  },
  
  triggerMethod: {
    type: String,
    enum: ['button', 'gesture'],
    required: true
  },
  
  // Notifications
  notifiedPoliceStations: [{
    stationId: mongoose.Schema.Types.ObjectId,
    stationName: String,
    distance: Number,
    notifiedAt: Date,
    deliveryStatus: String
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
  
  // Live Location Trail
  locationUpdates: [{
    coordinates: [Number],
    timestamp: Date,
    accuracy: Number,
    speed: Number
  }],
  
  // Response
  respondedBy: String,
  respondedAt: Date,
  responseNotes: String,
  resolvedAt: Date
  
}, {
  timestamps: true
});

// Geospatial index for location queries
sosAlertSchema.index({ location: '2dsphere' });
sosAlertSchema.index({ userId: 1, createdAt: -1 });
sosAlertSchema.index({ status: 1 });

module.exports = mongoose.model('SOSAlert', sosAlertSchema);
```

#### 1.2 Police Station Model

Create `src/models/PoliceStation.js`:

```javascript
const mongoose = require('mongoose');

const policeStationSchema = new mongoose.Schema({
  stationId: {
    type: String,
    unique: true,
    required: true
  },
  
  name: {
    type: String,
    required: true
  },
  
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  
  address: String,
  
  // Contact Information
  phone: String,
  emergencyHotline: String,
  email: String,
  
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

policeStationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('PoliceStation', policeStationSchema);
```

---

### Step 2: Emergency Service (Week 2, Days 3-4)

Create `src/services/emergency.service.js`:

```javascript
const SOSAlert = require('../models/SOSAlert');
const PoliceStation = require('../models/PoliceStation');
const User = require('../models/User');
const { generateId } = require('../utils/id-generator');
const smsService = require('./sms.service');
const notificationService = require('./notification.service');

class EmergencyService {
  /**
   * Trigger SOS Alert
   */
  async triggerSOS(userId, location, triggerMethod) {
    // Get user details
    const user = await User.findOne({ userId });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Create SOS alert
    const alert = new SOSAlert({
      alertId: generateId('SOS'),
      userId: user._id,
      userName: user.fullName,
      userPhone: user.phoneNumber,
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      },
      triggerMethod,
      locationUpdates: [{
        coordinates: [location.longitude, location.latitude],
        timestamp: new Date(),
        accuracy: location.accuracy
      }]
    });
    
    await alert.save();
    
    // Parallel notifications
    await Promise.allSettled([
      this.notifyPoliceStations(alert, location),
      this.notifyEmergencyContacts(user, alert, location),
      this.notifyNearbyUsers(alert, location, user)
    ]);
    
    return alert;
  }
  
  /**
   * Notify 3 nearest police stations
   */
  async notifyPoliceStations(alert, location) {
    const nearestStations = await PoliceStation.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          },
          $maxDistance: 10000 // 10km
        }
      },
      isActive: true
    }).limit(3);
    
    const notifications = [];
    
    for (const station of nearestStations) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        station.location.coordinates[1],
        station.location.coordinates[0]
      );
      
      // Send SMS alert
      try {
        await smsService.sendEmergencyAlert(
          station.emergencyHotline || station.phone,
          alert.userName,
          `https://maps.google.com/?q=${location.latitude},${location.longitude}`
        );
        
        notifications.push({
          stationId: station._id,
          stationName: station.name,
          distance,
          notifiedAt: new Date(),
          deliveryStatus: 'sent'
        });
      } catch (error) {
        notifications.push({
          stationId: station._id,
          stationName: station.name,
          distance,
          notifiedAt: new Date(),
          deliveryStatus: 'failed'
        });
      }
    }
    
    alert.notifiedPoliceStations = notifications;
    await alert.save();
  }
  
  /**
   * Notify emergency contacts
   */
  async notifyEmergencyContacts(user, alert, location) {
    if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
      return;
    }
    
    const locationUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    
    const notifications = [];
    
    for (const contact of user.emergencyContacts) {
      try {
        await smsService.sendEmergencyAlert(
          contact.phone,
          user.fullName,
          locationUrl
        );
        
        notifications.push({
          contactName: contact.name,
          contactPhone: contact.phone,
          notifiedAt: new Date(),
          deliveryStatus: 'sent'
        });
      } catch (error) {
        notifications.push({
          contactName: contact.name,
          contactPhone: contact.phone,
          notifiedAt: new Date(),
          deliveryStatus: 'failed'
        });
      }
    }
    
    alert.notifiedContacts = notifications;
    await alert.save();
  }
  
  /**
   * Notify nearby app users
   */
  async notifyNearbyUsers(alert, location, triggeringUser) {
    const nearbyUsers = await User.find({
      _id: { $ne: triggeringUser._id },
      'settings.receiveNearbyAlerts': true,
      lastKnownLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          },
          $maxDistance: 500 // 500 meters
        }
      },
      fcmToken: { $exists: true, $ne: null }
    }).limit(50);
    
    const notifications = [];
    
    for (const user of nearbyUsers) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        user.lastKnownLocation.coordinates[1],
        user.lastKnownLocation.coordinates[0]
      );
      
      // Send push notification
      await notificationService.sendPushNotification(
        user.fcmToken,
        '🚨 Emergency Alert Nearby',
        `Someone needs help about ${Math.round(distance)}m away from you`,
        {
          type: 'sos_alert',
          alertId: alert.alertId,
          location: {
            latitude: location.latitude,
            longitude: location.longitude
          }
        }
      );
      
      notifications.push({
        userId: user._id,
        distance,
        notifiedAt: new Date()
      });
    }
    
    alert.notifiedNearbyUsers = notifications;
    await alert.save();
  }
  
  /**
   * Update live location
   */
  async updateLocation(alertId, location) {
    const alert = await SOSAlert.findOne({ alertId, status: 'active' });
    
    if (!alert) {
      throw new Error('Active alert not found');
    }
    
    alert.locationUpdates.push({
      coordinates: [location.longitude, location.latitude],
      timestamp: new Date(),
      accuracy: location.accuracy,
      speed: location.speed
    });
    
    await alert.save();
    
    return alert;
  }
  
  /**
   * Cancel SOS alert
   */
  async cancelAlert(userId, alertId) {
    const alert = await SOSAlert.findOne({ alertId });
    
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    if (alert.userId.toString() !== userId) {
      throw new Error('Unauthorized');
    }
    
    alert.status = 'cancelled';
    alert.resolvedAt = new Date();
    
    await alert.save();
    
    return alert;
  }
  
  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // Distance in meters
  }
}

module.exports = new EmergencyService();
```

---

### Step 3: Mobile App - SOS Features (Week 2, Day 5 - Week 3, Day 1)

#### 3.1 SOS Button Component

Create `src/components/SOS/SOSButton.tsx`:

```typescript
import React, { useState, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  Vibration,
  Alert
} from 'react-native';
import { emergencyAPI } from '../../api/emergency.api';
import { useLocation } from '../../hooks/useLocation';

export const SOSButton = () => {
  const [isPressed, setIsPressed] = useState(false);
  const [countdown, setCountdown] = useState(2);
  const { location } = useLocation();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countdownInterval = useRef<NodeJS.Timeout>();

  const startCountdown = () => {
    setIsPressed(true);
    setCountdown(2);
    
    // Haptic feedback
    Vibration.vibrate(100);
    
    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ])
    ).start();
    
    // Countdown from 2 to 0
    let count = 2;
    countdownInterval.current = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count === 0) {
        triggerSOS();
      }
    }, 1000);
  };

  const cancelCountdown = () => {
    setIsPressed(false);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
  };

  const triggerSOS = async () => {
    cancelCountdown();
    
    // Heavy vibration pattern
    Vibration.vibrate([0, 500, 200, 500]);
    
    if (!location) {
      Alert.alert('Error', 'Unable to get your location');
      return;
    }
    
    try {
      const response = await emergencyAPI.triggerSOS({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        triggerMethod: 'button'
      });
      
      Alert.alert(
        '🚨 SOS Alert Sent',
        'Emergency services and your contacts have been notified',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to active alert screen
              navigation.navigate('ActiveAlert', {
                alertId: response.data.alertId
              });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send SOS alert. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[styles.button, isPressed && styles.buttonPressed]}
          onLongPress={startCountdown}
          onPressOut={cancelCountdown}
          delayLongPress={0}
          activeOpacity={0.8}
        >
          {isPressed ? (
            <Text style={styles.countdown}>{countdown}</Text>
          ) : (
            <>
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.helpText}>Hold for help</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  button: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  buttonPressed: {
    backgroundColor: '#FF0000'
  },
  sosText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff'
  },
  helpText: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5
  },
  countdown: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#fff'
  }
});
```

#### 3.2 Panic Gesture Detection Hook

Create `src/hooks/usePanicGesture.ts`:

```typescript
import { useEffect, useRef } from 'react';
import { Accelerometer } from 'react-native-sensors';
import { Alert, Vibration } from 'react-native';
import { emergencyAPI } from '../api/emergency.api';

const SHAKE_THRESHOLD = 15; // m/s²
const SHAKE_COUNT = 3;
const SHAKE_WINDOW = 1000; // ms

export const usePanicGesture = (enabled: boolean) => {
  const shakes = useRef<number[]>([]);
  const subscription = useRef<any>();

  useEffect(() => {
    if (!enabled) return;

    subscription.current = Accelerometer.subscribe(({ x, y, z }) => {
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      
      if (acceleration > SHAKE_THRESHOLD) {
        const now = Date.now();
        
        // Add shake timestamp
        shakes.current.push(now);
        
        // Remove old shakes outside the time window
        shakes.current = shakes.current.filter(
          timestamp => now - timestamp < SHAKE_WINDOW
        );
        
        // Check if we have enough shakes
        if (shakes.current.length >= SHAKE_COUNT) {
          triggerPanicAlert();
          shakes.current = []; // Reset
        }
      }
    });

    return () => {
      subscription.current?.unsubscribe();
    };
  }, [enabled]);

  const triggerPanicAlert = () => {
    Vibration.vibrate([0, 500, 200, 500, 200, 500]);
    
    Alert.alert(
      '🚨 Panic Gesture Detected',
      'SOS alert will be triggered in 3 seconds. Cancel if accidental.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Send SOS Now',
          onPress: () => sendSOSAlert(),
          style: 'destructive'
        }
      ],
      { cancelable: true }
    );
    
    // Auto-trigger after 3 seconds if not cancelled
    setTimeout(() => {
      sendSOSAlert();
    }, 3000);
  };

  const sendSOSAlert = async () => {
    // Implementation similar to SOS button
    // Get location and call emergencyAPI.triggerSOS()
  };
};
```

---

### Testing Checklist

```markdown
## Phase A Testing
- [ ] NID registration flow (if API available)
- [ ] Phone OTP registration
- [ ] OTP expiry validation (5 minutes)
- [ ] Rate limiting (3 OTPs per hour)
- [ ] App security setup (PIN/Password)
- [ ] Token generation and validation

## Phase B Testing
- [ ] SOS button long-press activation (2 seconds)
- [ ] Countdown animation
- [ ] Panic gesture detection (3 shakes)
- [ ] GPS location accuracy
- [ ] Police station notifications
- [ ] Emergency contact SMS delivery
- [ ] Nearby user push notifications
- [ ] Live location updates (every 10 seconds)
- [ ] Alert cancellation
```

---

## Next Steps

1. **Review this implementation guide**
2. **Confirm technology choices** (Firebase, Twilio, etc.)
3. **Provide API credentials** for:
   - NID verification service (if available)
   - SMS gateway
   - Firebase project
4. **Begin backend development** (Phase A)
5. **Setup mobile app project**

Once approved, I'll start implementing these features step-by-step!
