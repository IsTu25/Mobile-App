import api from './apiClient';

export const authAPI = {
  // Send OTP to phone number
  sendOTP: async (phoneNumber) => {
    const response = await api.post('/auth/send-otp', { phoneNumber });
    return response.data;
  },

  // Send OTP to email
  sendEmailOTP: async (email) => {
    const response = await api.post('/auth/send-email-otp', { email });
    return response.data;
  },

  // Verify OTP and register/login
  verifyOTP: async (phoneNumber, otp, fullName = null, email = null) => {
    const response = await api.post('/auth/verify-otp', {
      phoneNumber,
      otp,
      fullName,
      email,
    });
    return response.data;
  },

  // Verify Email OTP
  verifyEmailOTP: async (email, otp) => {
    const response = await api.post('/auth/verify-email-otp', {
      email,
      otp,
    });
    return response.data;
  },

  // Setup app security (PIN/Password)
  setupAppSecurity: async (type, secret) => {
    const response = await api.post('/auth/app-security/setup', {
      type,
      secret,
    });
    return response.data;
  },

  // Verify app security
  verifyAppSecurity: async (secret) => {
    const response = await api.post('/auth/app-security/verify', { secret });
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update FCM token
  updateFCMToken: async (fcmToken) => {
    const response = await api.post('/auth/fcm-token', { fcmToken });
    return response.data;
  },
  // Register
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login
  login: async (phoneNumber, password) => {
    const response = await api.post('/auth/login', { phoneNumber, password });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

export default authAPI;
