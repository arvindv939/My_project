import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { __DEV__ } from 'react-native';

// ✅ Dynamic API URL based on platform and environment
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to access host machine
      return 'http://10.0.2.2:5000/api'; // local backend IP
    } else if (Platform.OS === 'ios') {
      // iOS simulator can use localhost
      return 'http://localhost:5000/api';
    } else {
      // Physical device - replace with your actual IP
      return 'http://192.168.1.12:5000/api';
    }
  } else {
    // Production mode - replace with your production API URL
    return 'http://192.168.1.12:5000/api'; // same for prod for now
  }
};

export const API_BASE_URL = getApiBaseUrl();

// ✅ Create axios instance with better error handling
const API: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for mobile networks
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ✅ Add auth token to request headers
API.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL}${config.url}`,
        headers: config.headers,
        data: config.data,
      });

      return config;
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return config;
    }
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ✅ Enhanced response interceptor with better error handling
API.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    console.error('❌ API Response Error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
    });

    // Handle different types of network errors
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      console.error('🌐 Network connectivity issue detected');
      throw new Error(
        'Unable to connect to server. Please check your internet connection.'
      );
    }

    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout');
      throw new Error('Request timed out. Please try again.');
    }

    if (error.response?.status === 401) {
      console.log('🔐 Unauthorized - clearing auth data');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      throw new Error('Session expired. Please login again.');
    }

    if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

// ✅ Test connection function
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testing connection to:', API_BASE_URL);
    const response = await API.get('/health');
    console.log('✅ Connection test successful:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
};

export default API;
