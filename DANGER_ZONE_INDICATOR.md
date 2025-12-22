# Danger Zone Indicator Feature

## Overview
The NIRAPOTTA app now includes a **real-time danger zone indicator** that uses AI-powered predictions based on Bangladesh crime data (2020-2024) to alert users about their current safety status and nearby danger zones.

## Features Implemented

### 1. **Top Bar Danger Indicator** 🚨
- **Location**: Top of the Home Screen
- **Purpose**: Shows real-time danger level of the user's current location
- **Color Coding**:
  - 🔴 **Red** - Critical/Danger Zone (Risk Score 75-100)
  - 🟠 **Orange** - High Risk Area (Risk Score 60-74)
  - 🟡 **Yellow** - Medium Risk (Risk Score 40-59)
  - 🟢 **Green** - Safe Zone (Risk Score 0-39)
- **Information Displayed**:
  - Status icon and text
  - Current risk score (0-100)

### 2. **Nearest Danger Zone Alert** ⚠️
- **Location**: Below the welcome header on Home Screen
- **Purpose**: Informs users about the nearest danger zone to help them avoid it
- **Features**:
  - Shows danger zone name (e.g., "Uttara", "Gulshan")
  - Displays distance from current location
  - Shows risk level of that zone
  - Provides safety recommendations based on proximity:
    - **< 500m**: "Consider leaving this area immediately"
    - **500m-1km**: "Avoid moving towards this area"
    - **> 1km**: "Be cautious if traveling in this direction"
  - Tap to view detailed information

### 3. **Detailed Danger Information**
When users tap on the Nearest Danger Zone Alert, they see:
- Exact location name
- Risk score and level
- Risk factors (location, history, time, day)
- Number of recent incidents nearby

## Technical Implementation

### New Files Created

1. **`mobile-expo/src/api/dangerAPI.js`**
   - API client for danger prediction endpoints
   - Methods:
     - `getAIRiskScore()` - AI-based prediction
     - `getRiskScore()` - Traditional calculation
     - `getNearbyIncidents()` - Crime incidents
     - `getHotspots()` - All danger zones
     - `getSafeRoute()` - Safe route suggestions

2. **`mobile-expo/src/components/Danger/DangerStatusBar.js`**
   - Colored status bar component
   - Dynamic color based on risk level
   - Shows risk score

3. **`mobile-expo/src/components/Danger/NearestDangerAlert.js`**
   - Alert card component
   - Shows nearest danger zone details
   - Interactive (tap for more info)
   - Provides safety recommendations

### Modified Files

1. **`mobile-expo/src/screens/Home/HomeScreen.js`**
   - Added danger prediction state management
   - Integrated DangerStatusBar component
   - Integrated NearestDangerAlert component
   - Added ScrollView for better UX
   - Fetches danger data on location change

## How It Works

### Data Flow
1. **Location Acquisition**: App gets user's current GPS coordinates
2. **Risk Calculation**: Sends coordinates to backend AI model
3. **AI Prediction**: Backend analyzes:
   - Proximity to crime hotspots
   - Historical crime data (1,107 Bangladesh crime records)
   - Current time of day
   - Day of week
4. **Display**: Shows color-coded status bar and nearest danger alert

### Backend Integration
The feature uses the existing danger prediction service:
- **Endpoint**: `POST /api/danger/ai-risk-score`
- **Dataset**: Bangladesh crime data (2020-2024)
- **Model**: AI-trained on 1,107 real crime records
- **Coverage**: Dhaka metropolitan area with 11+ crime hotspots

## User Experience

### On Login/App Open
1. User logs in and reaches Home Screen
2. App requests location permission (if not granted)
3. **Top bar shows**: "Analyzing location..." (gray)
4. Within 1-2 seconds:
   - Top bar updates with color-coded danger level
   - Nearest danger zone alert appears (if any nearby)

### Visual Feedback
- **Safe Area**: Green bar, "No Danger Zones Nearby" message
- **Danger Area**: Red bar, detailed warning with distance and recommendations
- **Loading State**: Gray bar with loading text

### Interaction
- Users can **tap** on the nearest danger zone alert to see:
  - Full risk breakdown
  - Contributing factors
  - Number of recent incidents

## Safety Recommendations

The system provides context-aware recommendations:
- **Immediate Danger** (< 500m): Suggests leaving area
- **Nearby Danger** (500m-1km): Warns against approaching
- **Distant Danger** (> 1km): Advises caution

## Future Enhancements

Potential improvements:
1. **Real-time Updates**: Refresh danger status every 5 minutes
2. **Route Planning**: Integrate with maps to show safe routes
3. **Push Notifications**: Alert when entering danger zones
4. **Historical Tracking**: Show user's safety history
5. **Community Reports**: Allow users to report incidents
6. **Offline Mode**: Cache danger zones for offline access

## Testing

To test the feature:
1. Launch the app and login
2. Grant location permissions
3. Observe the top bar color change based on your location
4. Check the nearest danger zone alert
5. Tap the alert to view details
6. Try moving to different locations to see updates

## API Endpoints Used

- `POST /api/danger/ai-risk-score` - AI prediction
- `POST /api/danger/risk-score` - Traditional calculation (fallback)
- `GET /api/danger/nearby-incidents` - Recent incidents
- `GET /api/danger/hotspots` - All danger zones

## Dependencies

No new dependencies required. Uses existing:
- `expo-location` - GPS coordinates
- `react-native` - UI components
- `axios` - API calls (via apiClient)

## Notes

- The danger prediction is based on **real Bangladesh crime data** from 2020-2024
- The AI model is trained on 1,107 crime records covering Dhaka
- Risk scores are calculated using multiple factors (location, time, history, day)
- The system works in real-time and updates based on current location
