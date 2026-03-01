#!/bin/bash

# Script to update IP address across all project files
# Usage: ./update-ip.sh [new-ip-address]

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 IP Address Update Script"
echo "=============================="

# Get current IP if no argument provided
if [ -z "$1" ]; then
    echo "📡 Detecting current IP address..."
    CURRENT_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
    
    if [ -z "$CURRENT_IP" ]; then
        echo "❌ Could not detect IP address automatically"
        echo "Usage: ./update-ip.sh <new-ip-address>"
        echo "Example: ./update-ip.sh 192.168.1.100"
        exit 1
    fi
    
    NEW_IP=$CURRENT_IP
else
    NEW_IP=$1
fi

echo -e "${GREEN}✅ IP Address: $NEW_IP${NC}"
echo ""

# Find old IP in files
OLD_IP=$(grep -r "http://192.168" mobile-expo/src/api/apiClient.js 2>/dev/null | grep -oE '192\.168\.[0-9]+\.[0-9]+' | head -1)

if [ -z "$OLD_IP" ]; then
    echo "⚠️  No existing IP found, will use $NEW_IP"
    OLD_IP="192.168.0.104"
else
    echo "📝 Current IP in files: $OLD_IP"
fi

if [ "$OLD_IP" == "$NEW_IP" ]; then
    echo -e "${GREEN}✅ IP address is already up to date!${NC}"
    exit 0
fi

echo ""
echo "🔄 Updating IP from $OLD_IP to $NEW_IP..."
echo ""

# Files to update
    "mobile-expo/src/api/apiClient.js"
    "backend/server.js"
    "backend/test-danger-api.js"
    "backend/test-comprehensive.js"
    "backend/test-interactive.js"
    "backend/test-prompt.js"
)

# Update each file
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        # Create backup
        cp "$file" "$file.backup"
        
        # Replace IP
        sed -i '' "s/$OLD_IP/$NEW_IP/g" "$file"
        
        echo -e "${GREEN}✅${NC} Updated: $file"
    else
        echo -e "${YELLOW}⚠️${NC}  Not found: $file"
    fi
done

echo ""
echo "=============================="
echo -e "${GREEN}✅ IP update complete!${NC}"
echo ""
echo "Updated files:"
echo "  - Mobile app API client"
echo "  - Backend test scripts"
echo ""
echo "New IP: $NEW_IP"
echo ""
echo "💡 Tip: Restart your mobile app and backend server for changes to take effect"
