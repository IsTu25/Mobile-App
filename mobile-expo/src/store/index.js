import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import emergencyReducer from './slices/emergencySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    emergency: emergencyReducer,
  },
});

export default store;
