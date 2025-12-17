# Quick Start Guide

## Prerequisites Checklist

Before running the mobile app, make sure you have:

- [ ] **Node.js 20+** installed ([Download](https://nodejs.org/))
- [ ] **Android Studio** installed ([Download](https://developer.android.com/studio))
- [ ] **JDK 17** installed ([Download](https://adoptium.net/))
- [ ] **Android SDK** configured in Android Studio
- [ ] **Android Emulator** created or physical device connected
- [ ] **MongoDB** running (local or Atlas)

## Quick Setup (3 Steps)

### Step 1: Automatic Setup

Run the setup script:
```bash
# Double-click setup.bat
# OR run in terminal:
.\setup.bat
```

This will install all dependencies for both backend and mobile.

### Step 2: Start Backend

**Terminal 1:**
```bash
cd backend

# First time only - seed police stations
npm run seed

# Start server
npm run dev
```

**Wait for:** `✅ MongoDB Connected` and `🚀 Server running on port 5000`

### Step 3: Run Mobile App

**Terminal 2 - Start Metro:**
```bash
cd mobile
npm start
```

**Terminal 3 - Run on Android:**
```bash
cd mobile  
npm run android
```

**First build:** 5-10 minutes
**Subsequent builds:** 30 seconds

---

## Configuration

**Important:** Update API URL before running mobile app!

Edit `mobile/src/api/apiClient.js` line 5:

```javascript
// For Android Emulator
const BASE_URL = 'http://10.0.2.2:5000/api';

// For Real Device (replace with your PC's IP)
// const BASE_URL = 'http://192.168.1.XXX:5000/api';
```

**Find your PC IP:**
```bash
ipconfig
# Look for "IPv4 Address"
```

---

## Testing the App

### 1. Register
- Phone: `+8801234567890`
- Name: `Test User`
- Tap "Send OTP"

### 2. Get OTP from Backend Console
```
📱 Mock SMS to +8801234567890
🔐 OTP Code: 123456
```

### 3. Verify OTP
- Enter: `123456`
- Tap "Verify OTP"

### 4. Setup PIN
- Choose PIN
- Enter: `1234`
- Confirm: `1234`

### 5. Trigger SOS
- Grant location permission
- Hold SOS button for 2 seconds
- Confirm alert

---

## Troubleshooting

### "Metro bundler not running"
```bash
cd mobile
npm start -- --reset-cache
```

### "Build failed"
```bash
cd mobile/android
.\gradlew clean
cd ../..
npm run android
```

### "Cannot connect to backend"
- Check backend is running: http://localhost:5000/health
- Update BASE_URL in `apiClient.js`
- For device: PC and phone must be on same WiFi

### "Location not working"
- Android Emulator: Set location in emulator controls (... button)
- Real Device: Enable GPS in phone settings

---

## What You Need

### For Android Emulator Development:
1. **Android Studio** with emulator
2. **JDK 17**
3. **Node.js**
4. **MongoDB**

### For Real Device Testing:
1. All above, plus:
2. **Android device** with USB debugging enabled
3. **USB cable**
4. **PC and phone on same WiFi** (for API connection)

---

## Commands Reference

```bash
# Setup (one time)
.\setup.bat

# Backend
cd backend
npm run seed              # Seed database (first time)
npm run dev               # Start server

# Mobile
cd mobile
npm install               # Install dependencies
npm start                 # Start Metro bundler
npm run android           # Build and run
npm start -- --reset-cache  # Clear cache if needed

# Debug
adb devices               # Check connected devices
adb logcat               # View Android logs
```

---

## Need More Help?

See **MOBILE_SETUP.md** for:
- Detailed Android Studio setup
- Environment variable configuration
- Comprehensive troubleshooting
- iOS setup (macOS only)

---

## Success! App Should Show:

1. ✅ Registration screen on emulator/device
2. ✅ Backend console shows OTP codes
3. ✅ Can complete registration flow
4. ✅ SOS button works with location
5. ✅ Backend creates alerts
