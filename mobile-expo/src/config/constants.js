import { Platform } from 'react-native';

// Get base IP from current environment for easier testing
// In local dev, change this to your machine's local IP (e.g. 192.168.0.104)
const BASE_IP = '192.168.0.101'; // Default IP for the current dev environment

export const API_BASE_URL = `http://${BASE_IP}:3000/api`;
export const AI_SERVER_URL = `http://${BASE_IP}:5001`;

export const CONFIG = {
    BASE_IP,
    API_BASE_URL,
    AI_SERVER_URL,
    SOS_CHECK_INTERVAL: 5000,
    LOCATION_INTERVAL: 5000,
    DISTANCE_INTERVAL: 10,
};

export default CONFIG;
