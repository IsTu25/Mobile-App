# IP Address Configuration Guide

## 🌐 Your Current IP Address

**Current IP**: `192.168.0.148`

This IP is already configured in all your project files! ✅

---

## 📁 Files Using This IP

The following files contain your IP address:

1. **Mobile App**:
   - `mobile-expo/src/api/apiClient.js` (lines 7-9)

2. **Backend Test Scripts**:
   - `backend/test-danger-api.js` (line 5)
   - `backend/test-comprehensive.js` (line 8)
   - `backend/test-interactive.js` (line 9)
   - `backend/test-prompt.js` (line 10)

3. **Backend Server**:
   - `backend/server.js` (lines 30, 33)

---

## 🔄 How to Update IP Address

### Method 1: Automatic Script (Recommended) ⭐

I've created a script that automatically detects and updates your IP!

```bash
# Run the script (it will auto-detect your current IP)
./update-ip.sh

# Or specify a new IP manually
./update-ip.sh 172.20.10.2
```

**What it does**:
- ✅ Detects your current IP automatically
- ✅ Finds old IP in all files
- ✅ Updates all files at once
- ✅ Creates backups before updating
- ✅ Shows confirmation

### Method 2: Manual Update

If your IP changes, update these files:

#### 1. Mobile App API Client
**File**: `mobile-expo/src/api/apiClient.js`

```javascript
const BASE_URL = Platform.select({
  ios: 'http://YOUR_NEW_IP:3000/api',
  android: 'http://YOUR_NEW_IP:3000/api',
  default: 'http://YOUR_NEW_IP:3000/api',
});
```

#### 2. Test Scripts
Update `BASE_URL` in:
- `backend/test-danger-api.js`
- `backend/test-comprehensive.js`
- `backend/test-interactive.js`
- `backend/test-prompt.js`

```javascript
const BASE_URL = 'http://YOUR_NEW_IP:3000';
```

---

## 🔍 How to Find Your IP Address

### On Mac:

```bash
# Wi-Fi
ipconfig getifaddr en0

# Ethernet
ipconfig getifaddr en1

# Or use the script
./update-ip.sh
```

### On Windows:

```bash
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

### On Linux:

```bash
hostname -I
# Or
ip addr show
```

---

## 🚀 After Updating IP

1. **Restart Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Restart Mobile App**:
   ```bash
   cd mobile-expo
   npm start --clear
   ```

3. **Verify Connection**:
   - Check backend logs for the new IP
   - Test API from mobile app
   - Run test scripts to confirm

---

## 💡 Common Scenarios

### Scenario 1: Changed Wi-Fi Network

```bash
# Your IP changed from 172.20.10.2 to 192.168.1.50
./update-ip.sh 192.168.1.50
```

### Scenario 2: Using Different Computer

```bash
# Detect new IP automatically
./update-ip.sh
```

### Scenario 3: Testing on Physical Device

Make sure:
- ✅ Phone and computer on same Wi-Fi
- ✅ IP address is correct
- ✅ Backend server is running
- ✅ Port 3000 is not blocked by firewall

---

## 🔧 Troubleshooting

### Problem: "Cannot connect to server"

**Solution**:
1. Check your current IP: `ipconfig getifaddr en0`
2. Update IP in files: `./update-ip.sh`
3. Restart backend and mobile app

### Problem: "Script not working"

**Solution**:
```bash
# Make script executable
chmod +x update-ip.sh

# Run it
./update-ip.sh
```

### Problem: "IP keeps changing"

**Solution**:
Set a static IP in your router settings for your Mac's MAC address.

---

## 📊 Current Configuration

```
Backend Server:  http://172.20.10.2:3000
Mobile App API:  http://172.20.10.2:3000/api
Health Check:    http://172.20.10.2:3000/health
```

**Status**: ✅ All files configured correctly!

---

## 🎯 Quick Reference

```bash
# Find current IP
ipconfig getifaddr en0

# Update all files automatically
./update-ip.sh

# Update with specific IP
./update-ip.sh 172.20.10.2

# Test connection
curl http://172.20.10.2:3000/health
```

Your IP configuration is ready to use! 🎉
