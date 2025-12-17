@echo off
echo Starting Expo with increased memory...
set NODE_OPTIONS=--max-old-space-size=4096
cd mobile-expo
npx expo start --clear
pause
