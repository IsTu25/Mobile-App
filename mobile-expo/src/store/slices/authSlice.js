import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  hasAppSecurity: false,
  appSecurityType: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.hasAppSecurity = action.payload?.appSecurity?.enabled || false;
      state.appSecurityType = action.payload?.appSecurity?.type || null;
      state.error = null;
    },
    setTokens: (state, action) => {
      state.tokens = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.hasAppSecurity = false;
      state.appSecurityType = null;
      state.error = null;
    },
  },
});

export const { setLoading, setError, setUser, setTokens, logout } =
  authSlice.actions;

export default authSlice.reducer;
