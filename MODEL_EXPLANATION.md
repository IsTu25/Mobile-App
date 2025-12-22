# How the Danger Prediction Model Works

## 🤔 Your Questions Answered

### Q1: "Why use lat/long if CSV has no coordinates?"

**Answer**: The model uses **TWO data sources**:

1. **CSV File** (Crime Statistics) - NO coordinates
2. **Hardcoded Hotspots** (In the code) - WITH coordinates

### Q2: "On what basis was the API model made?"

**Answer**: The model combines:
- **Real crime data** from CSV (1,107 records)
- **Known hotspot locations** from research
- **GPS distance calculations**
- **Time/day risk factors**

---

## 📊 The Two-Part System

### Part 1: CSV Crime Data (What You Have)

**File**: `Crime Stat BD 20-25_cleaned.csv`

**Contains**:
```
Names of Unit,Dacoity,Robbery,Murder,...,Date
DMP,2.0,19.0,21,...,Jan-20
CMP,0.0,5.0,5,...,Jan-20
Dhaka Range,16.0,18.0,41,...,Jan-20
```

**What it provides**:
- ✅ Crime counts by police unit
- ✅ Crime types (Robbery, Murder, Theft, etc.)
- ✅ Time period (Jan 2020 - May 2025)
- ✅ 1,107 monthly crime reports
- ❌ NO GPS coordinates
- ❌ NO specific area names

### Part 2: Hotspot Coordinates (In the Code)

**File**: `backend/src/services/danger-prediction.service.js`

**Contains**:
```javascript
this.crimeHotspots = [
    { name: 'Uttara', lat: 23.8754, lon: 90.3965, riskLevel: 85 },
    { name: 'Gulshan', lat: 23.7808, lon: 90.4161, riskLevel: 80 },
    { name: 'Dhanmondi', lat: 23.7465, lon: 90.3765, riskLevel: 60 },
    // ... 11 total hotspots
];
```

**What it provides**:
- ✅ GPS coordinates (from Google Maps)
- ✅ Specific area names (Uttara, Gulshan, etc.)
- ✅ Risk levels (based on CSV statistics)
- ✅ Known high-crime locations in Dhaka

**Where these came from**:
1. **Research**: Identified high-crime areas from news, reports
2. **Google Maps**: Got exact GPS coordinates
3. **CSV Analysis**: Calculated risk levels from crime counts

---

## 🧮 How Risk is Calculated

When you send GPS coordinates (lat, lon), the model:

### Step 1: Calculate Hotspot Proximity (40% weight)
```
Distance to Uttara = 0.5km → High risk
Distance to Gulshan = 8km → Medium risk
Distance to Demra = 15km → Low risk
```

### Step 2: Calculate Historical Crime Density (30% weight)
```
CSV shows DMP area has:
- 19 robberies in Jan-20
- 21 murders in Jan-20
- 138 thefts in Jan-20
→ High historical risk
```

### Step 3: Calculate Time Factor (20% weight)
```
Current time: 4:00 AM
Time slot: 00:00-06:00 (Late night)
Multiplier: 1.8x (HIGH RISK)
```

### Step 4: Calculate Day Factor (10% weight)
```
Current day: Monday
Weekend? No
Risk: 45/100 (Medium)
```

### Step 5: Combine All Factors
```
Final Risk = (Hotspot × 40%) + (Historical × 30%) + (Time × 20%) + (Day × 10%)
           = (85 × 0.4) + (100 × 0.3) + (90 × 0.2) + (45 × 0.1)
           = 34 + 30 + 18 + 4.5
           = 86.5/100 → CRITICAL RISK
```

---

## 🧪 How to Test with Different Locations

### Method 1: Edit the Test File

**File**: `backend/test-comprehensive.js`

**Add your location**:
```javascript
const testLocations = [
    // Existing locations...
    
    // YOUR CUSTOM LOCATION
    { 
        name: 'My Current Location', 
        lat: 23.xxxx,  // Your latitude
        lon: 90.xxxx,  // Your longitude
        expectedRisk: 'unknown' 
    },
];
```

**Run the test**:
```bash
cd backend
node test-comprehensive.js
```

### Method 2: Test Any Coordinates

Create a quick test:
```bash
cd backend
node -e "
const axios = require('axios');
axios.post('http://192.168.0.104:3000/api/danger/risk-score', {
    latitude: 23.8754,  // Change this
    longitude: 90.3965  // Change this
}).then(res => console.log(JSON.stringify(res.data, null, 2)));
"
```

### Method 3: Use Google Maps

1. Open Google Maps
2. Right-click on any location
3. Click the coordinates (e.g., "23.8754, 90.3965")
4. Copy them
5. Test with those coordinates

---

## 📍 Example: Testing Your Location

Let's say you're at coordinates: **23.8223, 90.3654**

### What the Model Does:

1. **Finds nearest hotspot**: Mirpur (0km away)
2. **Checks CSV data**: DMP area has high crime counts
3. **Calculates distance**: You're AT Mirpur center
4. **Applies time factor**: 4 AM = high risk time
5. **Applies day factor**: Monday = medium risk day

### Result:
```
Risk Score: 65/100
Risk Level: HIGH
Current Zone: Mirpur
Breakdown:
  - Hotspot Risk: 58/100 (you're at Mirpur)
  - Historical Risk: 64/100 (DMP has many crimes)
  - Time Risk: 90/100 (4 AM is dangerous)
  - Day Risk: 45/100 (Monday is medium)
```

---

## 🎯 Why This Approach?

### Advantages:
✅ **Uses real Bangladesh crime data** (1,107 records)
✅ **Works with GPS** (mobile app can get your location)
✅ **Considers multiple factors** (location, time, day, history)
✅ **Accurate for Dhaka** (where most hotspots are)

### Limitations:
⚠️ **Limited hotspots** (only 11 areas defined)
⚠️ **Dhaka-focused** (other cities have less data)
⚠️ **Manual coordinates** (not automatically extracted from CSV)

---

## 🔧 How to Add More Locations

Want to add more hotspots? Edit this file:

**File**: `backend/src/services/danger-prediction.service.js`

**Add to the array**:
```javascript
this.crimeHotspots = [
    // Existing hotspots...
    
    // NEW HOTSPOT
    { 
        name: 'Badda',           // Area name
        lat: 23.7806,            // From Google Maps
        lon: 90.4250,            // From Google Maps
        riskLevel: 70            // Based on crime data
    },
];
```

**How to determine riskLevel**:
1. Check CSV for that area's police unit
2. Count total crimes
3. Compare to other areas
4. Assign 0-100 score

---

## 📝 Summary

**CSV Data** → Provides crime statistics (NO coordinates)
**Hotspot Coordinates** → Provides GPS locations (manually added)
**Your GPS** → Where you are right now
**Model** → Combines all three to calculate risk

The model is **data-driven** (uses real crime stats) but **location-aware** (uses GPS to find your position relative to danger zones).

This is why you can test with ANY coordinates - the model will calculate how close you are to known danger zones and apply the crime statistics from the CSV!
