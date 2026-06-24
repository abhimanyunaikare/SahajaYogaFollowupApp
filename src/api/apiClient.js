import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ENV = "local";    // change to "production" when needed

const BASE_URLS = {
  production: "http://sahajayoga-pune.org/api",
  dev: "http://sahajayoga-pune.org/dev/api",  // or dev.sahajayoga-pune.org/api
  local: "http://192.168.101.131:8000/api",
};

const api = axios.create({
  // baseURL: 'http://sahajayoga-pune.org/api', 
  baseURL: BASE_URLS[ENV],
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    // Setting to undefined forces the underlying Native XHR 
    // to generate the correct multipart/form-data with boundary
    config.headers['Content-Type'] = undefined;
  }
  
  return config;
});

export default api;