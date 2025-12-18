# 📱 NIRAPOTTA - Mobile App (Expo)

The client-side mobile application for **Nirapotta**, providing users with immediate access to safety tools, emergency reporting, and SOS services. Built with React Native and Expo for a fast, reliable, and cross-platform experience.

---

## ✨ Features

### 🆘 Emergency SOS
- **Long-Press Activation**: Secure 2-second hold to trigger high-priority SOS alerts.
- **Haptic Feedback**: Tactile response when SOS is engaged.
- **Instant GPS**: Captures and transmits high-precision coordinates to the backend.

### 🔐 Multi-Factor Auth
- **Seamless Login**: OTP-based authentication via phone and email.
- **App Privacy**: Secondary local security screen for PIN/Password confirmation.

### 🎥 Emergency Evidence
- **Automatic Recording**: Automatically captures video when SOS is triggered.
- **Backend Sync**: Streams/uploads evidence for AI face recognition analysis.

---

## 🛠️ Tech Stack
- **Framework**: React Native (Expo SDK 54)
- **State Management**: Redux Toolkit & RTK Query
- **Navigation**: React Navigation 7
- **Native Modules**: Expo Location, Expo Camera, Expo Haptics, Expo AV (Video)

---

## ⚙️ Development Setup

### 1. Install Dependencies
```bash
cd mobile-expo
npm install
```

### 2. Configure API Endpoint
Edit `src/api/apiClient.js`:
```javascript
// MUST be your local PC's IP address for physical device testing
const BASE_URL = 'http://192.168.1.XXX:5000/api'; 
```

### 3. Launch App
```bash
# Start Metro Bundler
npx expo start
```
*Use **Expo Go** on your physical device to scan the QR code.*

---

## 📂 Architecture
- `src/api/`: API service definitions using Axios.
- `src/components/`: Reusable UI components (SOS Button, Inputs).
- `src/screens/`: High-level navigation screens (Auth, Home, SOS).
- `src/store/`: Global state management logic.

---

## 📄 License
ISC License. Part of the **Nirapotta** Safety Suite.
