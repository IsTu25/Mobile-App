@echo off
echo ========================================
echo Backend API Quick Test
echo ========================================
echo.

echo [1/3] Testing Health Check...
curl -s http://localhost:5000/health
echo.
echo.

echo [2/3] Sending OTP to +8801234567890...
curl -s -X POST http://localhost:5000/api/auth/send-otp -H "Content-Type: application/json" -d "{\"phoneNumber\": \"+8801234567890\"}"
echo.
echo.

echo ========================================
echo Check backend console for OTP code!
echo Copy it and continue...
echo ========================================
set /p OTP="Enter OTP from console: "

echo.
echo [3/3] Verifying OTP...
curl -s -X POST http://localhost:5000/api/auth/verify-otp -H "Content-Type: application/json" -d "{\"phoneNumber\": \"+8801234567890\", \"otp\": \"%OTP%\", \"fullName\": \"Test User\"}" > response.json

echo.
echo ========================================
echo Response saved to response.json
echo.
echo Check backend console for registration confirmation!
echo ========================================
echo.

type response.json
echo.
pause
