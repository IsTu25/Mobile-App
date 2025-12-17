# Mobile App Setup & Running Instructions

Complete guide to set up and run the Community Safety mobile app on Android/iOS.

## Prerequisites

### 1. Development Environment

**Install Node.js:**
- Download Node.js 20+ from https://nodejs.org/
- Verify installation:
  ```bash
  node --version  # Should show v20.x.x
  npm --version   # Should show 10.x.x
  ```

**Install Git:**
- Windows: https://git-scm.com/download/win
- Verify: `git --version`

### 2. React Native Environment

#### For Android Development:

**A. Install Java Development Kit (JDK 17):**
- Download from: https://www.oracle.com/java/technologies/downloads/#java17
- Or use OpenJDK: https://adoptium.net/
- Set `JAVA_HOME` environment variable

**B. Install Android Studio:**
1. Download from: https://developer.android.com/studio
2. During installation, ensure these are checked:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (AVD)

**C. Configure Android SDK:**
1. Open Android Studio → Settings → Appearance & Behavior → System Settings → Android SDK
2. Select "SDK Platforms" tab, install:
   - Android 13.0 (Tiramisu) - API Level 33
   - Android 12.0 (S) - API Level 31
3. Select "SDK Tools" tab, install:
   - Android SDK Build-Tools
   - Android Emulator
   - Android SDK Platform-Tools
   - Intel x86 Emulator Accelerator (if using Intel CPU)

**D. Set Environment Variables:**

Windows:
```
ANDROID_HOME = C:\Users\YourUsername\AppData\Local\Android\Sdk

Add to PATH:
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

Verify:
```bash
adb --version
```

#### For iOS Development (macOS only):

**Install Xcode:**
- Download from Mac App Store
- Open Xcode, install Command Line Tools
- Open Xcode → Preferences → Locations → Select Command Line Tools

**Install CocoaPods:**
```bash
sudo gem install cocoapods
```

---

## Step-by-Step Setup

### Step 1: Install React Native CLI

```bash
npm install -g react-native-cli
```

### Step 2: Navigate to Mobile Directory

```bash
cd "e:\Shadab and Co\mobile"
```

### Step 3: Install Dependencies

```bash
npm install
```

**Expected time:** 3-5 minutes

**Troubleshooting:**
- If you get permission errors, run terminal as Administrator
- If errors persist, delete `node_modules` and `package-lock.json`, then run `npm install` again

### Step 4: Configure API Connection

**Edit:** `mobile/src/api/apiClient.js`

Change line 5:
```javascript
// For Android Emulator (10.0.2.2 = localhost on PC)
const BASE_URL = 'http://10.0.2.2:5000/api';

// For Real Android Device on same WiFi network
// const BASE_URL = 'http://YOUR_PC_IP_ADDRESS:5000/api';

// For iOS Simulator
// const BASE_URL = 'http://localhost:5000/api';
```

**To find your PC's IP address:**
```bash
# Windows
ipconfig
# Look for "IPv4 Address" under your WiFi adapter
```

### Step 5: Start Backend Server

**Open new terminal:**
```bash
cd "e:\Shadab and Co\backend"

# First time only: Seed police stations
npm run seed

# Start server
npm run dev
```

**Should see:**
```
✅ MongoDB Connected
🚀 Server running on port 5000
```

**Leave this terminal running!**

---

## Running on Android

### Option A: Android Emulator (Recommended for first test)

**1. Create Virtual Device:**
- Open Android Studio → Tools → AVD Manager
- Click "Create Virtual Device"
- Select device: Pixel 5 or Pixel 6
- Select system image: Android 13 (API 33)
- Click Finish

**2. Start Emulator:**
- In AVD Manager, click ▶️ (Play) button
- Wait for emulator to fully boot (shows home screen)

**3. Run App:**

Open new terminal:
```bash
cd "e:\Shadab and Co\mobile"

# Start Metro bundler
npm start
```

Open another terminal:
```bash
cd "e:\Shadab and Co\mobile"

# Build and run on emulator
npm run android
```

**Expected behavior:**
- Gradle builds the app (first time: 5-10 minutes)
- App automatically installs on emulator
- App opens showing Registration screen

### Option B: Physical Android Device

**1. Enable Developer Mode on Phone:**
- Go to Settings → About Phone
- Tap "Build Number" 7 times
- Developer Options now appears in Settings

**2. Enable USB Debugging:**
- Settings → Developer Options
- Enable "USB Debugging"
- Connect phone to PC via USB cable

**3. Verify Connection:**
```bash
adb devices
```
Should show:
```
List of devices attached
XXXXXXXX    device
```

**4. Run App:**
```bash
cd "e:\Shadab and Co\mobile"
npm start         # Terminal 1
npm run android   # Terminal 2
```

---

## Running on iOS (macOS only)

### Step 1: Install Pods
```bash
cd "e:\Shadab and Co\mobile/ios"
pod install
cd ..
```

### Step 2: Run App
```bash
npm run ios
```

Or open Xcode:
```bash
open ios/SafetyApp.xcworkspace
```
Then click Run (▶️) button

---

## Troubleshooting

### Metro Bundler Port Already in Use
```bash
# Kill process on port 8081
# Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Then restart
npm start -- --reset-cache
```

### App Build Fails
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### "Unable to connect to development server"
- Make sure Metro bundler is running (`npm start`)
- Check that BASE_URL in `apiClient.js` is correct
- For emulator: Use `10.0.2.2`
- For device: Use your PC's IP address

### Location Permission Not Working
- Android Emulator: Send fake location via emulator controls (... button → Location)
- Real Device: Make sure GPS is enabled

### Backend Connection Failed
- Verify backend is running: `http://localhost:5000/health`
- Check firewall isn't blocking port 5000
- For real device: PC and phone must be on same WiFi network

---

## Testing the App

### 1. Registration Flow

**a. Enter Details:**
- Phone: `+8801234567890` (or any format)
- Name: `Your Name`
- Tap "Send OTP"

**b. Get OTP:**
- Check backend terminal for OTP code
- You'll see: `🔐 OTP Code: 123456`

**c. Verify:**
- Enter the 6-digit OTP
- Tap "Verify OTP"
- Should navigate to App Security Setup

### 2. App Security Setup

- Choose "PIN"
- Enter: `1234`
- Confirm: `1234`
- Tap "Setup Security"
- Should navigate to Home screen

### 3. Test SOS Button

**a. Grant Location Permission:**
- When prompted, tap "Allow"
- Android emulator: Set location via emulator controls

**b. Trigger SOS:**
- Hold the red SOS button for 2 seconds
- Watch the progress fill up
- Feel haptic vibration at end
- Alert confirmation appears

**c. Confirm:**
- Tap "Yes, Send Alert"
- Check backend terminal for:
  ```
  ✅ SOS Alert created: SOS_...
  🚓 Alerted police station: Gulshan Police Station
  ```

---

## What You Should See

### Registration Screen
```
┌─────────────────────────┐
│  Welcome to Safety App  │
│ Enter your details to   │
│     get started         │
│                         │
│  [Full Name...........]│
│  [Phone Number.......]│
│                         │
│     [Send OTP]         │
└─────────────────────────┘
```

### Home Screen with SOS
```
┌─────────────────────────┐
│  Welcome, John!         │
│  ✓ Location Active      │
│                         │
│   Emergency SOS         │
│  Hold button for 2s     │
│                         │
│        ╔═══╗            │
│       ║ SOS ║           │
│       ║Hold║            │
│        ╚═══╝            │
└─────────────────────────┘
```

---

## Quick Command Reference

```bash
# Backend
cd "e:\Shadab and Co\backend"
npm run dev              # Start server
npm run seed             # Seed police stations (first time)

# Mobile
cd "e:\Shadab and Co\mobile"
npm install              # Install dependencies (first time)
npm start                # Start Metro bundler
npm run android          # Run on Android
npm run ios              # Run on iOS (macOS only)

# Debugging
adb devices              # List connected Android devices
adb logcat               # View Android logs
npm start -- --reset-cache  # Clear Metro cache
```

---

## Development Workflow

**Typical workflow:**

1. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Metro** (Terminal 2):
   ```bash
   cd mobile
   npm start
   ```

3. **Run App** (Terminal 3):
   ```bash
   cd mobile
   npm run android
   ```

Now you can:
- Edit code in VS Code
- Save files - Metro auto-reloads
- View changes in emulator instantly

**Hot Reload:** Press 'r' in Metro terminal to reload

---

## Common Issues & Solutions

### Issue: "Command not found: react-native"
**Solution:** Install globally: `npm install -g react-native-cli`

### Issue: Gradle build fails with "SDK location not found"
**Solution:** Create `android/local.properties`:
```
sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

### Issue: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"
**Solution:** Uninstall old version from emulator, then reinstall

### Issue: White screen on app launch
**Solution:** 
```bash
npm start -- --reset-cache
# Then rebuild
npm run android
```

### Issue: Cannot connect to backend from device
**Solution:**
1. Find PC IP: `ipconfig` (Windows)
2. Update `apiClient.js`: `http://192.168.1.XXX:5000/api`
3. Allow port 5000 in Windows Firewall
4. Ensure phone and PC on same WiFi

---

## Tips

1. **Keep 3 terminals open:**
   - Backend server
   - Metro bundler
   - Build/run commands

2. **First build takes time:**
   - Android: 5-10 minutes first time
   - Subsequent builds: 30 seconds

3. **Use emulator for development:**
   - Faster testing
   - Easy debugging
   - No USB cable needed

4. **Test on real device before production:**
   - Better performance
   - Real GPS/sensors
   - Actual user experience

5. **Enable Fast Refresh:**
   - Already enabled by default
   - Saves time during development
   - Changes appear instantly

---

## Next Steps

Once app is running successfully:

1. ✅ Test registration flow
2. ✅ Test SOS button
3. ✅ Verify backend alerts are created
4. Add emergency contacts
5. Test on real device
6. Configure Firebase for push notifications
7. Add Twilio credentials for real SMS

---

Need help? Check the backend console for error messages!
