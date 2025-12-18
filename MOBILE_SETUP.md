# 📱 NIRAPOTTA - Mobile Setup Guide (নিরাপত্তা)

Comprehensive instructions for setting up the **Nirapotta** mobile application using React Native and Expo.

---

## 🛠️ Environment Setup

### 1. Core Requirements
- **Node.js**: v20+ (LTS recommended)
- **Watchman**: (Mac only) `brew install watchman`
- **Expo Go App**: Download on your [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) or [iOS](https://apps.apple.com/app/expo-go/id982107779) device.

### 2. Physical Device Setup (Recommended)
1. Install **Expo Go** from the App Store or Play Store.
2. Ensure your phone and PC are connected to the **same WiFi network**.
3. Enable **Location Services** on your device (required for SOS triggers).

### 3. Emulator Setup (Optional)
- **Android**: Install Android Studio and set up an Android Virtual Device (AVD).
- **iOS**: Install Xcode and set up a simulator (Mac only).

---

## 🚀 Running the App

### Step 1: Install Dependencies
```bash
cd mobile-expo
npm install
```

### Step 2: Configure API Endpoint
The app needs to know where your backend is running. **Do not use `localhost`** if testing on a physical device.

1. Find your computer's IP address:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`
2. Update `src/api/apiClient.js`:
   ```javascript
   const BASE_URL = 'http://192.168.1.XXX:5000/api'; 
   ```

### Step 3: Start Metro Bundler
```bash
npx expo start
```
*Tip: Press `a` for Android Emulator, `i` for iOS Simulator, or scan the QR code with your phone.*

---

## 🆘 Testing SOS Functionality
1. **Location**: Ensure the app has permission to access your location.
2. **Activation**: Long-press (2 seconds) the central SOS button.
3. **Haptics**: You should feel a vibration when the alert is triggered.
4. **Backend Sync**: Open your backend terminal to confirm the alert payload was received.

---

## ❓ Troubleshooting

### "Network Error" on physical device
- **WiFi**: Confirm both devices are on exactly the same network.
- **Firewall**: Temporarily disable your PC's firewall or allow port `5000`.
- **IP Address**: Double-check the IP in `apiClient.js`.

### "Metro not responding"
- Clear cache and restart: `npx expo start -c`

---
*Empowering individuals through technology. Stay safe with Nirapotta.*

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
