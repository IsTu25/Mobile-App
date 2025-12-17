# Expo Mobile App

Alternate version of the Safety App designed to run with **Expo Go**.

## 🚀 Quick Start in 3 Steps

### 1. Install Dependencies
(If you haven't already via the agent)
```bash
cd mobile-expo
npx expo install axios @reduxjs/toolkit react-redux @react-native-async-storage/async-storage expo-location expo-haptics @react-navigation/native @react-navigation/stack react-native-screens react-native-safe-area-context react-native-gesture-handler
```

### 2. Configure Backend URL
**Crucial Step:** You must use your computer's IP address.

1. Find your IP:
   - Windows: Run `ipconfig` in terminal (Look for IPv4 Address, e.g., `192.168.1.10`)
   - Mac/Linux: Run `ifconfig`

2. Edit `mobile-expo/src/api/apiClient.js`:
   ```javascript
   // CHANGE THIS LINE!
   const BASE_URL = 'http://192.168.1.YOUR_IP:5000/api'; 
   ```

### 3. Run It!
1. Start Backend (in separate terminal):
   ```bash
   cd backend
   npm run dev
   ```

2. Start Expo:
   ```bash
   cd mobile-expo
   npx expo start
   ```

3. **On your Phone:**
   - Install **Expo Go** app from Store.
   - Scan the QR code shown in the terminal.
   - **Note:** Phone and PC must be on the same WiFi!

## Features Ported
- ✅ Registration & OTP
- ✅ SOS Button (using Expo Haptics/Vibration)
- ✅ Location Tracking (using `expo-location`)
- ✅ Navigation & Redux State

## Troubleshooting
- **"Network Error"**: Check if PC firewall is blocking port 5000. Check if phone is on same WiFi. Verify IP address in `apiClient.js`.
- **"Location Config"**: If location fails, ensure you granted permission on the phone.
