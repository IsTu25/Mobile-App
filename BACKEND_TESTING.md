# Backend API Testing Guide

Test the Community Safety backend without running the mobile app.

## Quick Start

### Step 1: Start Backend Server

```bash
cd backend
npm run dev
```

**Expected output:**
```
✅ MongoDB Connected: localhost
✅ Firebase Admin initialized (or mock mode)
🚀 ====================================
   Community Safety System Backend
   ====================================
   🌍 Server running on port 5000
   🔧 Environment: development
   📡 API Version: v1
   🏥 Health check: http://localhost:5000/health
   ====================================
```

### Step 2: Seed Database (First Time Only)

```bash
# In another terminal
cd backend
npm run seed
```

**Expected output:**
```
✅ Connected to database
🗑️  Cleared existing police stations
✅ Inserted 5 police stations
📍 Police Stations:
   - Dhanmondi Police Station
   - Gulshan Police Station
   - Mirpur Model Police Station
   - Uttara West Police Station
   - Banani Police Station
```

---

## Testing Methods

### Method 1: Using cURL (Built-in Windows/Linux)

#### Test 1: Health Check
```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2025-12-08T02:28:52Z"
}
```

#### Test 2: Send OTP
```bash
curl -X POST http://localhost:5000/api/auth/send-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"+8801234567890\"}"
```

**Expected Backend Console:**
```
📱 Mock SMS to +8801234567890
🔐 OTP Code: 123456
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "expiresIn": "5 minutes"
  }
}
```

#### Test 3: Verify OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"+8801234567890\", \"otp\": \"123456\", \"fullName\": \"Test User\"}"
```

**Save the accessToken from response for next tests!**

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "userId": "USR_...",
      "phoneNumber": "+8801234567890",
      "fullName": "Test User",
      "isVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "isNewUser": true
  }
}
```

#### Test 4: Setup App Security (Requires Token)
```bash
# Replace YOUR_ACCESS_TOKEN with the token from previous response
curl -X POST http://localhost:5000/api/auth/app-security/setup ^
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"type\": \"pin\", \"secret\": \"1234\"}"
```

#### Test 5: Trigger SOS Alert (Requires Token)
```bash
curl -X POST http://localhost:5000/api/emergency/sos ^
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"location\": {\"type\": \"Point\", \"coordinates\": [90.4125, 23.8103]}}"
```

**Expected Backend Console:**
```
✅ SOS Alert created: SOS_...
   - Notified 3 police stations
   - Notified 0 emergency contacts
   - Notified 0 nearby users
🚓 Alerted police station: Gulshan Police Station (1234m away)
🚓 Alerted police station: Banani Police Station (2100m away)
🚓 Alerted police station: Dhanmondi Police Station (3500m away)
```

---

### Method 2: Using PowerShell (Windows)

Create a test script: `test-api.ps1`

```powershell
# Test Backend API

$baseUrl = "http://localhost:5000"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Community Safety Backend API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n[Test 1] Health Check..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
Write-Host "Status: $($response.message)" -ForegroundColor Green

# Test 2: Send OTP
Write-Host "`n[Test 2] Sending OTP..." -ForegroundColor Yellow
$body = @{
    phoneNumber = "+8801234567890"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$baseUrl/api/auth/send-otp" -Method Post -Body $body -ContentType "application/json"
Write-Host "OTP sent: $($response.data.message)" -ForegroundColor Green
Write-Host "Check backend console for OTP code!" -ForegroundColor Cyan

# Test 3: Verify OTP
Write-Host "`n[Test 3] Verifying OTP..." -ForegroundColor Yellow
$otp = Read-Host "Enter OTP from backend console"

$body = @{
    phoneNumber = "+8801234567890"
    otp = $otp
    fullName = "Test User"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$baseUrl/api/auth/verify-otp" -Method Post -Body $body -ContentType "application/json"
$token = $response.data.tokens.accessToken
Write-Host "User registered: $($response.data.user.fullName)" -ForegroundColor Green
Write-Host "Token received!" -ForegroundColor Green

# Test 4: Setup App Security
Write-Host "`n[Test 4] Setting up PIN..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $token"
}
$body = @{
    type = "pin"
    secret = "1234"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$baseUrl/api/auth/app-security/setup" -Method Post -Body $body -ContentType "application/json" -Headers $headers
Write-Host "PIN setup: $($response.data.message)" -ForegroundColor Green

# Test 5: Trigger SOS
Write-Host "`n[Test 5] Triggering SOS Alert..." -ForegroundColor Yellow
$body = @{
    location = @{
        type = "Point"
        coordinates = @(90.4125, 23.8103)
    }
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$baseUrl/api/emergency/sos" -Method Post -Body $body -ContentType "application/json" -Headers $headers
Write-Host "SOS Alert ID: $($response.data.alert.alertId)" -ForegroundColor Green
Write-Host "Stations notified: $($response.data.alert.notifiedPoliceStations.Count)" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "All tests completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
```

**Run:**
```powershell
.\test-api.ps1
```

---

### Method 3: Using Postman (Recommended)

#### Setup Postman Collection

**1. Download & Install Postman:**
https://www.postman.com/downloads/

**2. Create New Collection:**
- Click "New" → "Collection"
- Name: "Community Safety API"

**3. Add Requests:**

##### Request 1: Health Check
- Method: `GET`
- URL: `http://localhost:5000/health`
- Click "Send"

##### Request 2: Send OTP
- Method: `POST`
- URL: `http://localhost:5000/api/auth/send-otp`
- Headers: `Content-Type: application/json`
- Body (raw, JSON):
  ```json
  {
    "phoneNumber": "+8801234567890"
  }
  ```

##### Request 3: Verify OTP
- Method: `POST`
- URL: `http://localhost:5000/api/auth/verify-otp`
- Body (raw, JSON):
  ```json
  {
    "phoneNumber": "+8801234567890",
    "otp": "123456",
    "fullName": "Test User"
  }
  ```
- After response, go to "Tests" tab and add:
  ```javascript
  // Auto-save token
  var data = pm.response.json();
  pm.environment.set("accessToken", data.data.tokens.accessToken);
  ```

##### Request 4: Trigger SOS
- Method: `POST`
- URL: `http://localhost:5000/api/emergency/sos`
- Headers: 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{accessToken}}`
- Body (raw, JSON):
  ```json
  {
    "location": {
      "type": "Point",
      "coordinates": [90.4125, 23.8103]
    }
  }
  ```

---

### Method 4: Using VS Code REST Client Extension

**1. Install Extension:**
- Open VS Code Extensions
- Search: "REST Client"
- Install by Huachao Mao

**2. Create:** `backend/test-api.http`

```http
### Health Check
GET http://localhost:5000/health

### Send OTP
POST http://localhost:5000/api/auth/send-otp
Content-Type: application/json

{
  "phoneNumber": "+8801234567890"
}

### Verify OTP (Replace OTP with code from console)
POST http://localhost:5000/api/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+8801234567890",
  "otp": "123456",
  "fullName": "Test User"
}

### Setup App Security (Replace TOKEN)
POST http://localhost:5000/api/auth/app-security/setup
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "type": "pin",
  "secret": "1234"
}

### Trigger SOS (Replace TOKEN)
POST http://localhost:5000/api/emergency/sos
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "location": {
    "type": "Point",
    "coordinates": [90.4125, 23.8103]
  }
}

### Get Nearby Alerts
GET http://localhost:5000/api/emergency/nearby-alerts?latitude=23.8103&longitude=90.4125&radius=5000
Authorization: Bearer YOUR_ACCESS_TOKEN

### Add Emergency Contact
POST http://localhost:5000/api/emergency/contacts
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+8801987654321",
  "relationship": "Brother"
}
```

**3. Click "Send Request" above each request!**

---

## Complete Test Workflow

### Scenario: Register User & Trigger SOS

```bash
# Step 1: Start Backend
cd backend
npm run dev

# Step 2: Health Check
curl http://localhost:5000/health

# Step 3: Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"+8801234567890\"}"

# Step 4: Check console for OTP (e.g., 123456)

# Step 5: Verify OTP
curl -X POST http://localhost:5000/api/auth/verify-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"+8801234567890\", \"otp\": \"123456\", \"fullName\": \"Test User\"}"

# Step 6: Copy accessToken from response

# Step 7: Trigger SOS (Replace YOUR_TOKEN)
curl -X POST http://localhost:5000/api/emergency/sos ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"location\": {\"type\": \"Point\", \"coordinates\": [90.4125, 23.8103]}}"

# Step 8: Check backend console for alert details
```

---

## All Available Endpoints

### Authentication
```
POST   /api/auth/send-otp              # Send OTP
POST   /api/auth/verify-otp            # Verify and register
POST   /api/auth/app-security/setup    # Setup PIN/Password
POST   /api/auth/app-security/verify   # Verify PIN/Password
POST   /api/auth/refresh-token         # Refresh access token
GET    /api/auth/me                    # Get user profile
POST   /api/auth/fcm-token             # Update FCM token
```

### Emergency Services
```
POST   /api/emergency/sos                     # Trigger SOS
PATCH  /api/emergency/sos/:alertId/location   # Update location
PATCH  /api/emergency/sos/:alertId/cancel     # Cancel SOS
GET    /api/emergency/sos/:alertId            # Get alert details
GET    /api/emergency/nearby-alerts           # Get nearby alerts
GET    /api/emergency/contacts                # Get contacts
POST   /api/emergency/contacts                # Add contact
DELETE /api/emergency/contacts/:phone         # Remove contact
```

---

## Expected Console Output

### Successful OTP Send:
```
📱 Mock SMS to +8801234567890: Your Safety App verification code is: 123456. Valid for 5 minutes. Do not share this code.
🔐 OTP Code: 123456
```

### Successful Registration:
```
✅ New user registered: +8801234567890
```

### Successful SOS Trigger:
```
✅ SOS Alert created: SOS_lmk9j8h7f6
   - Notified 3 police stations
   - Notified 0 emergency contacts
   - Notified 0 nearby users
🚓 Alerted police station: Gulshan Police Station (1234m away)
🚓 Alerted police station: Banani Police Station (2100m away)
🚓 Alerted police station: Dhanmondi Police Station (3500m away)
```

---

## Testing Tips

1. **Use Postman for complex testing** - Easiest UI
2. **Use VS Code REST Client** - Quick tests while coding
3. **Use cURL for automation** - Script testing
4. **Check backend console** - See OTP codes and alerts
5. **Save tokens** - Reuse for multiple requests

---

## Troubleshooting

### "Cannot connect"
- Check backend is running: `npm run dev`
- Verify MongoDB is running
- Check port 5000 isn't blocked

### "Invalid token"
- Token expired (15 min lifetime)
- Get new token by verifying OTP again
- Or use refresh token endpoint

### "OTP not found"
- OTP expires after 5 minutes
- Request new OTP
- Check you're using the latest OTP

### "Police stations not found"
- Run seed script: `npm run seed`
- Check MongoDB connection
- Verify database name in `.env`

---

## Quick Test Script

Save as `quick-test.bat`:

```batch
@echo off
echo Testing Backend API...
echo.

echo 1. Health Check...
curl -s http://localhost:5000/health
echo.

echo 2. Sending OTP...
curl -s -X POST http://localhost:5000/api/auth/send-otp -H "Content-Type: application/json" -d "{\"phoneNumber\": \"+8801234567890\"}"
echo.
echo.
echo Check backend console for OTP code!
pause
```

Run: `.\quick-test.bat`

---

**Backend testing complete!** No mobile app needed. 🚀
