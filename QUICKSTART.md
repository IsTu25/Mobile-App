# ⚡ NIRAPOTTA - Quick Start Guide (নিরাপত্তা)

Get the **Nirapotta** safety system up and running on your local machine in under 10 minutes.

---

## 📋 Prerequisites
- **Node.js**: v20 or higher
- **MongoDB**: Local instance or Atlas URI
- **Device**: Android Emulator or physical phone with **Expo Go**
- **Java**: JDK 17 (for Android specific builds if not using Expo Go)

---

## 🏃 3-Step Setup

### Step 1: Automated Installation
Run the root setup script to install dependencies for both components (Backend & Mobile):
```bash
.\setup.bat
```

### Step 2: Launch the Backend
```bash
cd backend
npm run seed  # One-time: Populates police station data
npm run dev   # Starts server on http://localhost:5000
```
*Note: Ensure your `.env` is configured (see README for details).*

### Step 3: Launch the Mobile App
```bash
cd mobile-expo
npm start
```
*Action: Scan the QR code using the **Expo Go** app on your phone.*

---

## 🛠️ Essential Configuration
**Crucial:** To connect your phone to the backend, you must use your computer's local IP address.

1. Find your IP (Windows: `ipconfig`, Mac: `ifconfig`).
2. Update `mobile-expo/src/api/apiClient.js`:
   ```javascript
   const BASE_URL = 'http://192.168.1.XXX:5000/api'; 
   ```

---

## 🧪 Basic Test Scenario
1. **Register**: Use any phone number (e.g., `+8801700000000`).
2. **OTP**: Check the backend terminal; the mock OTP code will be logged there.
3. **Trigger SOS**: Hold the red SOS button for 2 seconds.
4. **Verify**: Check the backend console to see the created alert and notified police stations.

---

## 📂 Documentation Links
- [Detailed Mobile Setup](MOBILE_SETUP.md)
- [Backend Testing Guide](BACKEND_TESTING.md)
- [Full Implementation Plan](implementation_plan.md)

---
*Stay Safe with Nirapotta.*
