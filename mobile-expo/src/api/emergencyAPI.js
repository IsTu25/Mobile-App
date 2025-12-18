import api from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export const emergencyAPI = {
  // Trigger SOS alert
  triggerSOS: async (location, triggerMethod = 'button') => {
    const response = await api.post('/emergency/sos', {
      location,
      triggerMethod,
    });
    return response.data;
  },

  // Update live location for active SOS
  updateSOSLocation: async (alertId, coordinates, accuracy) => {
    const response = await api.patch(`/emergency/sos/${alertId}/location`, {
      coordinates,
      accuracy,
    });
    return response.data;
  },

  // Cancel SOS alert
  cancelSOS: async (alertId) => {
    const response = await api.patch(`/emergency/sos/${alertId}/cancel`);
    return response.data;
  },

  // Get SOS alert details
  getSOSAlert: async (alertId) => {
    const response = await api.get(`/emergency/sos/${alertId}`);
    return response.data;
  },

  // Get nearby active SOS alerts
  getNearbyAlerts: async (latitude, longitude, radius = 5000) => {
    const response = await api.get('/emergency/nearby-alerts', {
      params: { latitude, longitude, radius },
    });
    return response.data;
  },

  // Get emergency contacts
  getContacts: async () => {
    const response = await api.get('/emergency/contacts');
    return response.data;
  },

  // Add emergency contact
  addContact: async (name, phone, relationship) => {
    const response = await api.post('/emergency/contacts', {
      name,
      phone,
      relationship,
    });
    return response.data;
  },

  // Remove emergency contact
  removeContact: async (phone) => {
    const response = await api.delete(`/emergency/contacts/${phone}`);
    return response.data;
  },

  // Upload SOS Video
  uploadVideo: async (videoUri, location, onProgress) => {
    const token = await AsyncStorage.getItem('accessToken');
    const baseUrl = api.defaults.baseURL;

    const uploadTask = FileSystem.createUploadTask(
      `${baseUrl}/emergency/sos-video`,
      videoUri,
      {
        httpMethod: 'POST',
        uploadType: 1, // FileSystemUploadType.MULTIPART
        fieldName: 'video',
        parameters: {
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
        },
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      },
      (progress) => {
        if (onProgress) {
          const percentage = progress.totalBytesSent / progress.totalBytesExpectedToSend;
          onProgress(percentage);
        }
      }
    );

    const response = await uploadTask.uploadAsync();
    const data = JSON.parse(response.body);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(data.message || 'Upload failed');
    }
    return data;
  },
};

export default emergencyAPI;
