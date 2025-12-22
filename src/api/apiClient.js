import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this with your Laravel API IP & port
const api = axios.create({
  baseURL: 'http://192.168.234.131:8000/api', // 👈 your laptop’s IP
  // baseURL: 'http://sahajayoga-pune.org/api/', // 👈 your website
  timeout: 5000,
});

// Attach Bearer token automatically (if stored)
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
