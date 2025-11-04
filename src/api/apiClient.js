import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this with your Laravel API IP & port
const api = axios.create({
  baseURL: 'http://192.168.131.131:8000/api', // 👈 your laptop’s IP
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
