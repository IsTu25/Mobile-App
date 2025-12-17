# Community Safety Reporting System - Backend API

Node.js + Express backend for the Community Safety Reporting System with MongoDB, Firebase integration, and comprehensive emergency services.

## Features

✅ **Authentication**
- Phone OTP verification
- JWT token-based authentication
- App-level security (PIN/Password)
- Rate-limited OTP requests

✅ **Emergency Services**
- SOS alert creation with geospatial location
- Auto-notify nearest 3 police stations
- SMS alerts to emergency contacts
- Push notifications to nearby users (500m radius)
- Live location tracking
- Emergency contact management

✅ **Security**
- Helmet.js for HTTP headers
- CORS configuration
- Rate limiting
- Input validation
- JWT token expiry

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Optional: Twilio account for SMS
- Optional: Firebase project for push notifications

### Installation

```bash
cd backend
npm install
```

### Configuration

Create `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and configure:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Generate a strong random secret
- `SMS_PROVIDER`: Set to `mock` for development or `twilio` for production
- Firebase credentials (optional)

### Running

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Seed database with sample police stations
npm run seed
```

Server will start on `http://localhost:5000`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to phone number |
| POST | `/api/auth/verify-otp` | Verify OTP and register/login |
| POST | `/api/auth/app-security/setup` | Setup PIN/Password |
| POST | `/api/auth/app-security/verify` | Verify PIN/Password |
| POST | `/api/auth/refresh-token` | Refresh access token |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/auth/fcm-token` | Update FCM token |

### Emergency Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/emergency/sos` | Trigger SOS alert |
| PATCH | `/api/emergency/sos/:alertId/location` | Update live location |
| PATCH | `/api/emergency/sos/:alertId/cancel` | Cancel SOS alert |
| GET | `/api/emergency/sos/:alertId` | Get SOS alert details |
| GET | `/api/emergency/nearby-alerts` | Get nearby active SOS alerts |
| GET | `/api/emergency/contacts` | Get emergency contacts |
| POST | `/api/emergency/contacts` | Add emergency contact |
| DELETE | `/api/emergency/contacts/:phone` | Remove emergency contact |

## Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Send OTP
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+8801234567890"}'
```

Check console for OTP code (in mock mode)

### Verify OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+8801234567890", "otp": "123456", "fullName": "Test User"}'
```

### Trigger SOS (requires authentication)
```bash
curl -X POST http://localhost:5000/api/emergency/sos \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"location": {"coordinates": [90.4125, 23.8103]}}'
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js  # MongoDB connection
│   │   ├── firebase.js  # Firebase Admin SDK
│   │   └── env.js       # Environment variables
│   ├── models/          # Mongoose models
│   │   ├── User.js
│   │   ├── OTP.js
│   │   ├── SOSAlert.js
│   │   └── PoliceStation.js
│   ├── services/        # Business logic
│   │   ├── auth.service.js
│   │   ├── sms.service.js
│   │   ├── notification.service.js
│   │   └── emergency.service.js
│   ├── controllers/     # Request handlers
│   │   ├── auth.controller.js
│   │   └── emergency.controller.js
│   ├── routes/          # API routes
│   │   ├── auth.routes.js
│   │   └── emergency.routes.js
│   ├── middleware/      # Express middleware
│   │   ├── auth.middleware.js
│   │   ├── rate-limit.middleware.js
│   │   ├── error.middleware.js
│   │   └── upload.middleware.js
│   ├── utils/           # Utilities
│   │   ├── id-generator.js
│   │   └── otp-generator.js
│   └── app.js           # Express app setup
├── server.js            # Entry point
├── seed.js              # Database seeder
├── .env.example         # Environment template
└── package.json
```

## Development Notes

### Mock Mode
- SMS: OTP codes are logged to console
- Firebase: Push notifications are logged (no actual sending)
- Perfect for development without external service dependencies

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Configure MongoDB Atlas
- [ ] Setup Twilio account and add credentials
- [ ] Setup Firebase project and add service account
- [ ] Configure CORS to only allow your frontend domain
- [ ] Enable HTTPS/TLS
- [ ] Setup monitoring and logging

## License

MIT
