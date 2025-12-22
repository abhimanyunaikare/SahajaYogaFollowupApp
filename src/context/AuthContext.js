import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from "../api/apiClient";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ LOGIN
  const login = async (newToken, userData) => {
    try {
      setToken(newToken);
      setUser(userData);

      // persist both user and token
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      // set default header for future API calls
      api.defaults.headers.Authorization = `Bearer ${newToken}`;
    } catch (error) {
      console.log('Login persistence error:', error);
    }
  };

  // ✅ LOGOUT
  const logout = async () => {
    try {
      setUser(null);
      setToken(null);
      await AsyncStorage.multiRemove(['token', 'user']);
      delete api.defaults.headers.Authorization;
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  // ✅ LOAD AUTH STATE on startup
  const loadUser = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.defaults.headers.Authorization = `Bearer ${storedToken}`;
      }
    } catch (error) {
      console.log('Error loading auth data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
