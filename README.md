# 🛡️ NIRAPOTTA (নিরাপত্তা)

**Nirapotta** (meaning "Safety" in Bengali) is a comprehensive community-driven safety reporting and emergency response system. It empowers citizens to report incidents in real-time and provides instant SOS assistance during emergencies.

![Project Status](https://img.shields.io/badge/Status-Development-orange)
![License](https://img.shields.io/badge/License-ISC-blue)
![React Native](https://img.shields.io/badge/Mobile-React_Native_%2F_Expo-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb)

---

## 🚀 Key Features

### 🆘 Emergency SOS Response
- **One-Tap SOS**: Long-press activation to prevent accidental triggers.
- **Smart Alerting**: Automatically notifies the 3 nearest police stations and emergency contacts.
- **Live Tracking**: Shares real-time GPS location with responders and trusted contacts.
- **Face Recognition**: Integrated AI-powered face recognition to identify individuals in emergency recordings.

### 📝 Incident Reporting
- **Multimedia Reports**: Attach photos and videos as evidence for incidents.
- **Anonymous Mode**: Report safety concerns without revealing your identity.
- **Community-Driven**: Upvote/downvote reports to help verify the legitimacy of incidents.
- **Geospatial Intelligence**: Reports are plotted on a live map for community awareness.

### 📊 Safety Analytics
- **Crime Heatmaps**: Visualizes high-risk areas based on historical incident data.
- **Route Safety Checker**: Analyze your planned travel route and receive safety recommendations.
- **Localized Statistics**: Detailed crime trends and safety scores for specific areas.

### 🔒 Privacy & Security
- **OTP Verification**: Secure login via phone and email OTP.
- **App Security**: PIN-based local protection for sensitive safety data.
- **Encrypted Data**: National ID (NID) and personal data are stored using industry-standard encryption.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Mobile App** | React Native (Expo SDK 52+), Redux Toolkit, React Navigation |
| **Backend API** | Node.js, Express.js, MongoDB Atlas (Geospatial Indexing) |
| **AI / ML** | face-api.js (for recognition & identification) |
| **Infrastructure** | Firebase (FCM, Storage, Admin SDK), Twilio & NodeMailer |
| **Security** | JWT, bcryptjs, express-rate-limit, Helmet |

---

## 📂 Project Structure

```text
NIRAPOTTA/
├── backend/            # Express.js API & Business Logic
│   ├── src/
│   │   ├── controllers/# Request handlers
│   │   ├── models/     # Mongoose schemas
│   │   ├── services/   # Business logic (SMS, Email, SOS)
│   │   └── utils/      # Face weights & helper functions
│   └── seed.js         # Initial data for police stations
├── mobile-expo/        # React Native application
│   ├── src/
│   │   ├── api/        # Axios configurations
│   │   ├── components/ # Reusable UI elements
│   │   └── screens/    # Navigation screens
│   └── app.json        # Expo configuration
├── QUICKSTART.md       # Fast-track setup guide
└── implementation_plan.md# Detailed technical roadmap
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v20+)
- MongoDB (Local or Atlas)
- Expo Go app on your physical device (for testing)

### 1. Setup Backend
```bash
cd backend
npm install
# Create .env file based on .env.example
npm run seed  # Feed initial police station data
npm run dev   # Start development server
```

### 2. Setup Mobile App
```bash
cd mobile-expo
npm install
npm start
```
*Scan the QR code with your Expo Go app (Android) or Camera app (iOS).*

---

## 📜 Environment Variables
Ensure you have the following in your `backend/.env`:
- `MONGODB_URI`: Your MongoDB connection string.
- `JWT_SECRET`: Secret key for authentication.
- `FIREBASE_SERVICE_ACCOUNT`: Path to your Firebase JSON key.
- `TWILIO_SID / AUTH_TOKEN`: Optional, for SMS alerts.
- `EMAIL_USER / PASS`: For automated safety notifications.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the ISC License.

---
*Created with ❤️ for community safety.*
