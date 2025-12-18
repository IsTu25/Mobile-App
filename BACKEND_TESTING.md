# 🧪 NIRAPOTTA - Backend API Testing Guide (নিরাপত্তা)

Ensure the **Nirapotta** engine is running correctly by testing its core modules: SOS, Face Recognition, and Authentication. This guide allows you to verify backend functionality without needing the mobile app.

---

## 🚀 Quick Start

### 1. Start Backend Server
```bash
cd backend
npm run dev
```
**Wait for:** `✅ MongoDB Connected` and `🚀 Server running on port 5000`

### 2. Seed Police Data (First Time)
```bash
npm run seed
```
This populates the local database with police stations required for the SOS geospatial logic.

---

## 🛠️ Testing Core Features

### 🆘 SOS & Alerts
You can trigger a mock SOS alert to verify the notification logic.

**cURL Command:**
```bash
curl -X POST http://localhost:5000/api/emergency/sos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"location\": {\"type\": \"Point\", \"coordinates\": [90.4125, 23.8103]}}"
```

**Check Backend Console for:**
- `✅ SOS Alert created`
- `🚓 Alerted 3 nearest police stations`
- `📧 Email sent to responders`

### 🧠 Face Recognition
Verify that the AI can identify individuals in an SOS video file.

**Requirements:**
1. Reference image in `backend/dataset/isfak.jpeg`.
2. Metadata entry in `backend/dataset/data.json`.

**Testing via API:**
```bash
# Upload an SOS video for analysis
curl -X POST http://localhost:5000/api/recognition/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "video=@path/to/test_sos_video.mp4"
```

**Expected Result:**
```json
{
  "matches": [
    {
      "name": "Md. Isfak Iqbal",
      "distance": 0.42,
      "info": "Safe / Authorized User"
    }
  ]
}
```

---

## 📂 Testing Tools Reference

### Method 1: Postman (Recommended)
1. **Health Check**: `GET http://localhost:5000/health`
2. **Setup Auth**: Use `POST /api/auth/verify-otp` to get a token, then add it to the `Authorization` header as `Bearer <token>`.

### Method 2: VS Code REST Client
Create a `test.http` file:
```http
POST http://localhost:5000/api/auth/send-otp
Content-Type: application/json

{ "phoneNumber": "+8801700000000" }
```

---

## 🏥 Health Check
Always verify the server status before deep testing:
`GET http://localhost:5000/health`

---
*Empowering safety through intelligent response. Stay safe with Nirapotta.*
