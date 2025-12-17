import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeAlert: null,
  isSOSActive: false,
  locationUpdates: [],
  contacts: [],
  loading: false,
  error: null,
};

const emergencySlice = createSlice({
  name: 'emergency',
  initialState,
  reducers: {
    setActiveAlert: (state, action) => {
      state.activeAlert = action.payload;
      state.isSOSActive = true;
      state.locationUpdates = [];
    },
    addLocationUpdate: (state, action) => {
      state.locationUpdates.push(action.payload);
    },
    clearActiveAlert: (state) => {
      state.activeAlert = null;
      state.isSOSActive = false;
      state.locationUpdates = [];
    },
    setContacts: (state, action) => {
      state.contacts = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setActiveAlert,
  addLocationUpdate,
  clearActiveAlert,
  setContacts,
  setLoading,
  setError,
} = emergencySlice.actions;

export default emergencySlice.reducer;
