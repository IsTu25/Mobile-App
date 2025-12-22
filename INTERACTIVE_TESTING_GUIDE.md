# Interactive Testing Guide

## 🎯 Three Ways to Test Any Location

### Method 1: Command Line Arguments (Fastest)

**File**: `test-interactive.js`

**Usage**:
```bash
cd backend
node test-interactive.js <latitude> <longitude>
```

**Examples**:
```bash
# Test Uttara
node test-interactive.js 23.8754 90.3965

# Test Gulshan
node test-interactive.js 23.7808 90.4161

# Test Dhanmondi
node test-interactive.js 23.7465 90.3765

# Test YOUR location (replace with your coordinates)
node test-interactive.js 23.xxxx 90.xxxx
```

**How to get coordinates**:
1. Open Google Maps
2. Right-click on any location
3. Click the coordinates (e.g., "23.8754, 90.3965")
4. Copy and paste into the command!

---

### Method 2: Interactive Menu (Easiest)

**File**: `test-prompt.js`

**Usage**:
```bash
cd backend
node test-prompt.js
```

**What happens**:
```
🗺️  DANGER PREDICTION TESTER
============================================================

Choose an option:

📍 Quick Test Locations:
  1. Uttara
  2. Gulshan
  3. Dhanmondi
  4. Mirpur
  5. Demra (Safe)
  6. Chittagong

  7. Enter custom coordinates
  8. Exit

Enter your choice (1-8): _
```

**Features**:
- ✅ Quick test predefined locations (just press 1-6)
- ✅ Enter custom coordinates (press 7)
- ✅ Test multiple locations without restarting
- ✅ User-friendly menu interface

---

### Method 3: One-Line Quick Test

**Usage**:
```bash
cd backend
node -e "
const axios = require('axios');
axios.post('http://192.168.0.104:3000/api/danger/risk-score', {
    latitude: 23.8754,  // CHANGE THIS
    longitude: 90.3965  // CHANGE THIS
}).then(res => {
    const d = res.data.data;
    console.log(\`Risk: \${d.riskScore}/100 (\${d.riskLevel})\`);
    console.log(\`Zone: \${d.location.currentZone.name}\`);
});
"
```

---

## 📍 How to Find Coordinates

### Option 1: Google Maps (Desktop)
1. Go to [Google Maps](https://maps.google.com)
2. Right-click on any location
3. Click the coordinates (they'll be copied!)
4. Paste into the test script

### Option 2: Google Maps (Mobile)
1. Open Google Maps app
2. Long-press on any location
3. Tap the coordinates at the bottom
4. Copy and paste

### Option 3: Your Current Location (Mobile)
1. Open Google Maps
2. Tap the blue dot (your location)
3. Tap "Share location"
4. Copy the coordinates from the link

---

## 🧪 Example Test Sessions

### Session 1: Test Uttara
```bash
$ node test-interactive.js 23.8754 90.3965

🧪 Testing Danger Prediction API
============================================================
📍 Testing Coordinates: 23.8754, 90.3965
============================================================

🔴 Risk Score: 87/100 (CRITICAL)
📍 Current Zone: Uttara
🎯 Nearest Danger: Uttara (0.00km)

💡 Recommendation:
   🚨 DANGER ZONE - Leave this area immediately!
```

### Session 2: Test Demra (Safe Area)
```bash
$ node test-interactive.js 23.7456 90.5234

🧪 Testing Danger Prediction API
============================================================
📍 Testing Coordinates: 23.7456, 90.5234
============================================================

🟡 Risk Score: 54/100 (MEDIUM)
📍 Current Zone: Demra
🎯 Nearest Danger: Demra (0.00km)

💡 Recommendation:
   ⚡ MEDIUM RISK - Stay alert and aware
```

### Session 3: Interactive Menu
```bash
$ node test-prompt.js

🚀 Interactive Danger Prediction Tester
Test any location in Bangladesh!

🗺️  DANGER PREDICTION TESTER
============================================================

Choose an option:

📍 Quick Test Locations:
  1. Uttara
  2. Gulshan
  3. Dhanmondi
  4. Mirpur
  5. Demra (Safe)
  6. Chittagong

  7. Enter custom coordinates
  8. Exit

Enter your choice (1-8): 1

============================================================
🧪 Testing: Uttara
📍 Coordinates: 23.8754, 90.3965
============================================================

🔴 Risk Score: 87/100 (CRITICAL)
📍 Current Zone: Uttara
🎯 Nearest Danger: Uttara (0.00km)

Test another location? (y/n): y

Enter your choice (1-8): 7

📍 Enter Custom Coordinates:
Tip: Get coordinates from Google Maps

Latitude (e.g., 23.8754): 23.7465
Longitude (e.g., 90.3965): 90.3765

============================================================
🧪 Testing: Custom Location
📍 Coordinates: 23.7465, 90.3765
============================================================

🟠 Risk Score: 67/100 (HIGH)
📍 Current Zone: Dhanmondi
🎯 Nearest Danger: Dhanmondi (0.00km)

Test another location? (y/n): n

👋 Goodbye!
```

---

## 🎯 Testing Your Current Location

### Step 1: Get Your Coordinates
- Open Google Maps on your phone
- Tap your blue location dot
- Copy the coordinates

### Step 2: Test Them
```bash
cd backend
node test-interactive.js <your-lat> <your-lon>
```

### Step 3: Understand the Result
The output will show:
- **Risk Score**: 0-100 (how dangerous your location is)
- **Current Zone**: Area name (e.g., "Uttara", "Dhanmondi")
- **Nearest Danger**: Closest high-crime area
- **Breakdown**: Why you got that score
- **Recommendation**: What to do

---

## 📊 Understanding the Output

### Risk Levels:
- 🔴 **75-100**: CRITICAL - Danger zone, leave immediately
- 🟠 **60-74**: HIGH - Very risky, be extremely cautious
- 🟡 **40-59**: MEDIUM - Stay alert and aware
- 🟢 **0-39**: LOW - Safe area

### Risk Breakdown:
- **Hotspot Proximity**: How close to known danger zones
- **Historical Crimes**: Crime frequency from dataset
- **Time Factor**: Current time (4 AM = high risk)
- **Day Factor**: Day of week (weekend = higher risk)

---

## 🔧 Adding Your Own Test Locations

Edit `test-prompt.js` and add to the `quickLocations` object:

```javascript
const quickLocations = {
    // Existing locations...
    
    // YOUR CUSTOM LOCATIONS
    '7': { name: 'My Home', lat: 23.xxxx, lon: 90.xxxx },
    '8': { name: 'My Office', lat: 23.yyyy, lon: 90.yyyy },
    '9': { name: 'My School', lat: 23.zzzz, lon: 90.zzzz },
};
```

---

## 💡 Pro Tips

1. **Test multiple locations** to compare risk levels
2. **Test at different times** (risk changes by hour)
3. **Save coordinates** of places you visit often
4. **Share results** with friends to warn them about dangerous areas

---

## 🚀 Quick Reference

```bash
# Method 1: Command line (fastest)
node test-interactive.js 23.8754 90.3965

# Method 2: Interactive menu (easiest)
node test-prompt.js

# Method 3: One-liner (quickest)
node -e "axios.post('http://192.168.0.104:3000/api/danger/risk-score', {latitude: 23.8754, longitude: 90.3965}).then(r => console.log(r.data))"
```

Now you can test **ANY location** just by entering coordinates! 🎯
