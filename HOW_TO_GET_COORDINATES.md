# How to Get Latitude and Longitude (Coordinates)

## 🎯 **5 Easy Methods**

---

## **Method 1: Google Maps (Desktop) - EASIEST** ⭐

### Steps:
1. Go to [Google Maps](https://www.google.com/maps)
2. **Right-click** anywhere on the map
3. Coordinates will appear at the top
4. **Click the coordinates** to copy them!

### Visual Example:
```
Right-click on map
    ↓
Coordinates appear: "23.8754, 90.3965"
    ↓
Click to copy
    ↓
Paste into test: node test-interactive.js 23.8754 90.3965
```

### Screenshot Guide:
```
┌─────────────────────────────────┐
│  Google Maps                    │
│                                 │
│  [Right-click here]             │
│         ↓                       │
│  23.8754, 90.3965 ← Click this! │
│                                 │
└─────────────────────────────────┘
```

---

## **Method 2: Google Maps (Mobile Phone)** 📱

### Steps:
1. Open **Google Maps app**
2. **Long-press** (hold your finger) on any location
3. A **red pin** will drop
4. Coordinates appear at the bottom
5. **Tap the coordinates** to copy

### Visual Example:
```
Long-press on map
    ↓
Red pin drops 📍
    ↓
Bottom shows: "23.8754, 90.3965"
    ↓
Tap to copy
```

---

## **Method 3: Your Current Location** 📍

### On Mobile:
1. Open Google Maps
2. Tap the **blue dot** (your location)
3. Tap the location name/address
4. Scroll down to see coordinates
5. Tap to copy

### Alternative:
1. Tap blue dot
2. Tap **"Share location"**
3. Copy the link - coordinates are in the URL!

---

## **Method 4: Search for a Place** 🔍

### Steps:
1. Search for any place (e.g., "Dhaka University")
2. Click on the result
3. Look at the **URL** in your browser:
   ```
   https://www.google.com/maps/@23.7289,90.3933,17z
                                 ↑ lat   ↑ lon
   ```
4. Copy the numbers!

### Or:
1. Search for the place
2. Right-click on the location marker
3. Copy coordinates

---

## **Method 5: Use Our Reference File** 📚

We've already prepared coordinates for **30+ common Bangladesh locations**!

### View all locations:
```bash
cd backend
node locations-reference.js
```

### Search for a specific place:
```bash
node locations-reference.js Uttara
node locations-reference.js University
node locations-reference.js Chittagong
```

### Output Example:
```
📍 Found 1 location(s) matching "Uttara":

Uttara:
  Latitude:  23.8754
  Longitude: 90.3965
  Risk:      HIGH
  Test:      node test-interactive.js 23.8754 90.3965
```

---

## 📋 **Quick Reference - Common Locations**

### High-Risk Areas (Dhaka):
```
Uttara:     23.8754, 90.3965
Gulshan:    23.7808, 90.4161
Banani:     23.7937, 90.4066
Paltan:     23.7338, 90.4125
Shahbag:    23.7389, 90.3948
```

### Medium-Risk Areas (Dhaka):
```
Dhanmondi:      23.7465, 90.3765
Mirpur:         23.8223, 90.3654
Mohammadpur:    23.7654, 90.3547
Badda:          23.7806, 90.4250
```

### Universities:
```
Dhaka University:   23.7289, 90.3933
BUET:               23.7263, 90.3925
IUT Gazipur:        23.9881, 90.4198
NSU:                23.8103, 90.4125
BRAC University:    23.7808, 90.4067
```

### Other Cities:
```
Chittagong:     22.3569, 91.7832
Sylhet:         24.8949, 91.8687
Khulna:         22.8456, 89.5403
Rajshahi:       24.3745, 88.6042
Cox's Bazar:    21.4272, 92.0058
```

---

## 🎯 **Step-by-Step Example**

### Let's find coordinates for "Bashundhara City":

#### Option 1: Google Maps
1. Open Google Maps
2. Search "Bashundhara City Dhaka"
3. Right-click on the location
4. Click coordinates: **23.7501, 90.3872**
5. Test: `node test-interactive.js 23.7501 90.3872`

#### Option 2: Our Reference
1. Run: `node locations-reference.js Bashundhara`
2. Copy coordinates: **23.7501, 90.3872**
3. Test: `node test-interactive.js 23.7501 90.3872`

---

## 💡 **Pro Tips**

### Tip 1: Save Your Favorite Locations
Create a file `my-locations.txt`:
```
Home:   23.xxxx, 90.xxxx
Office: 23.yyyy, 90.yyyy
School: 23.zzzz, 90.zzzz
```

### Tip 2: Google Maps URL Trick
Any Google Maps URL contains coordinates:
```
https://www.google.com/maps/@LAT,LON,17z
                              ↑   ↑
                            Copy these!
```

### Tip 3: Use Decimal Format
- ✅ Correct: `23.8754, 90.3965`
- ❌ Wrong: `23°52'31.4"N 90°23'47.4"E` (DMS format)

If you get DMS format, convert it:
- Google: "convert DMS to decimal"
- Or use Google Maps (it shows decimal by default)

---

## 🔧 **Testing Workflow**

### Complete workflow:
```bash
# 1. Find coordinates (choose one method):
   - Google Maps: Right-click → Copy
   - Our reference: node locations-reference.js Uttara
   - Your location: Google Maps → Blue dot → Copy

# 2. Test the location:
   node test-interactive.js <lat> <lon>

# 3. See results:
   Risk Score, Current Zone, Recommendations
```

### Example:
```bash
# Find Uttara coordinates
$ node locations-reference.js Uttara
  Latitude:  23.8754
  Longitude: 90.3965

# Test it
$ node test-interactive.js 23.8754 90.3965
  🔴 Risk Score: 87/100 (CRITICAL)
  📍 Current Zone: Uttara
  💡 DANGER ZONE - Leave immediately!
```

---

## 📱 **Mobile App Gets Coordinates Automatically!**

**Important**: The mobile app **automatically** gets your GPS coordinates!

You only need to manually find coordinates for:
- ✅ Testing different locations
- ✅ Checking places before you go
- ✅ Helping friends check their area

The app itself uses your phone's GPS to get real-time coordinates! 📍

---

## 🎓 **Understanding Coordinates**

### What are they?
- **Latitude**: North-South position (23.xxxx)
- **Longitude**: East-West position (90.xxxx)

### Bangladesh range:
- **Latitude**: 20.5 to 26.5 (North)
- **Longitude**: 88.0 to 92.5 (East)

### Example:
```
Dhaka:      23.8103, 90.4125
            ↑ Lat    ↑ Lon
            (North)  (East)
```

---

## ✅ **Summary**

**Easiest methods**:
1. 🥇 Google Maps (right-click)
2. 🥈 Our reference file (`locations-reference.js`)
3. 🥉 Your phone's location (blue dot)

**For testing**: Just copy coordinates and paste into:
```bash
node test-interactive.js <lat> <lon>
```

**For real use**: The mobile app gets your GPS automatically! 📱

No need to memorize coordinates - just use Google Maps or our reference file! 🎯
