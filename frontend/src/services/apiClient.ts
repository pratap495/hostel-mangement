import axios from 'axios';
import { Platform } from 'react-native';
import store from '../redux/store';

// Auto-resolve base URL: Android emulator uses 10.0.2.2, iOS / Web use localhost.
// Replace with host local IP (e.g., 'http://192.168.x.x') when testing on physical Wi-Fi devices.
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2';
  }
  return 'http://localhost';
};

export const API_BASE_URL = getBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL + '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure Axios request interceptors to load JWT token and active selected Hostel context
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    const activeHostelId = state.auth.activeHostelId;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (activeHostelId) {
      config.headers['X-Hostel-ID'] = activeHostelId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
