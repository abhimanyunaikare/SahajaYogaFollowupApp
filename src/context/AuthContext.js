import React, { createContext, useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native'; // Import AppState
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from "../api/apiClient";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Ref to track the current app state (active, background, etc.)
  const appState = useRef(AppState.currentState);

  // ✅ SYNC USER DATA (The "Secret Sauce")
  // Call this to get the latest role/permissions from the DB
  const syncProfile = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) return;

      // Assuming you have an endpoint like /auth/me or /users/profile
      const response = await api.get('/auth/me'); 
      const latestUserData = response.data;

      // Update state and storage if anything changed (like roles)
      setUser(latestUserData);
      await AsyncStorage.setItem('user', JSON.stringify(latestUserData));
      
      console.log('Profile synced successfully');
    } catch (error) {
      console.log('Sync error:', error);
      // If the error is 401/403, the token might be invalid/revoked
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
      }
    }
  };

  // ✅ LOGIN
  const login = async (newToken, userData) => {
    try {
      setToken(newToken);
      setUser(userData);
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
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
        
        // Immediately sync profile after loading local data
        syncProfile(); 
      }
    } catch (error) {
      console.log('Error loading auth data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    // ✅ Background Refresh Logic
    // This triggers syncProfile whenever the user re-opens the app
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        syncProfile();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, syncProfile }}>
      {children}
    </AuthContext.Provider>
  );
};