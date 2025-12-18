# 🛡️ NIRAPOTTA - Backend API (নিরাপত্তা)

The server-side engine for the **Nirapotta** safety ecosystem. Built with Node.js, Express, and MongoDB, it handles real-time emergency services, AI-powered face recognition, and secure user authentication.

---

## 🚀 Key Modules

### 🆘 Emergency Response Engine
- **Geo-Spatial SOS**: Uses MongoDB 2dsphere indexing to instantly find the 3 nearest police stations.
- **Multi-Channel Alerts**: Notifies police via email/API, sends SMS to emergency contacts, and push notifications to nearby users (500m radius).
- **Life Path Tracking**: Records and serves real-time GPS breadcrumbs of the user in distress.

### 🧠 Face Recognition Service
- **AI Analytics**: Integrated `face-api.js` for identifying individuals in uploaded SOS videos.
- **Recognition Pipeline**: Automatically extracts frames, detects faces, and compares them against the `backend/dataset`.
- **Match Alerts**: Includes identified criminal/missing person data in police reports.

### 🔒 Security & Auth
- **OTP Verification**: Phone and email verification via mock (dev) or Twilio/NodeMailer (prod).
- **App Guard**: Support for secondary PIN/Password authentication for sensitive user settings.
- **Privacy First**: Encryption for all sensitive fields and high-security HTTP headers via Helmet.

---

## 🛠️ Tech Stack
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: MongoDB (Geospatial)
- **AI**: face-api.js (TensorFlow.js under the hood)
- **Messaging**: Firebase Admin SDK (FCM), Twilio, NodeMailer

---

## 📂 Project Structure

```text
src/
├── controllers/     # Request logic (SOS, Auth, Recognition)
├── models/          # Mongoose schemas (User, SOSAlert, PoliceStation)
├── services/        # Business logic (Email, SMS, AI processing)
├── middleware/      # Auth, Rate-limiting, Video uploads
├── routes/          # API endpoint definitions
└── utils/           # Face weights & ID generators
```

---

## ⚙️ Setup & Run

### 1. Configure Environment
Create a `.env` file in the `backend/` root:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FIREBASE_SERVICE_ACCOUNT=path_to_json
EMAIL_USER=your_email
EMAIL_PASS=app_password
```

### 2. Install & Seed
```bash
npm install
npm run seed  # Crucial: Populates local police stations
```

### 3. Start Server
```bash
npm run dev   # Development mode with Nodemon
# OR
npm start     # Production mode
```

---

## 📍 API Reference (Highlights)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/send-otp` | Initiate phone/email verification |
| `POST` | `/api/emergency/sos` | Trigger SOS event (creates alert) |
| `PATCH`| `/api/emergency/:id/location` | Update live coordinates |
| `POST` | `/api/recognition/analyze` | Process SOS video for faces |

---

## 📄 License
ISC License. Part of the **Nirapotta** Safety Suite.
