import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from "../api/apiClient";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      setUser(null);
      setToken(null);
      await AsyncStorage.multiRemove(['token', 'user']);
      delete api.defaults.headers.Authorization;
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const login = async (newToken, userData) => {
    try {
      setToken(newToken);
      setUser(userData);
      api.defaults.headers.Authorization = `Bearer ${newToken}`;
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // ✅ THE CORE SECURITY CHECK
  const validateUserSession = useCallback(async (localUser) => {
    if (!localUser) return false;
    try {
      const response = await api.get("/auth/me");
      const serverUser = response.data;

      const roleChanged = String(serverUser.role_id) !== String(localUser.role_id);
      
      const serverPerms = serverUser.permissions || [];
      const localPerms = localUser.permissions || [];
      const permissionsChanged = 
        serverPerms.length !== localPerms.length ||
        !serverPerms.every(p => localPerms.includes(p));

      if (roleChanged || permissionsChanged) {
        console.warn("Security change detected! Logging out...");
        await logout();
        return false;
      }
      
      // Update state if server data is newer/different (e.g. name change)
      setUser(serverUser);
      await AsyncStorage.setItem('user', JSON.stringify(serverUser));
      return true;
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
      }
      return false;
    }
  }, [logout]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          api.defaults.headers.Authorization = `Bearer ${storedToken}`;
          
          // Verify session on startup
          await validateUserSession(parsedUser);
        }
      } catch (e) {
        console.error("Auth Init Error", e);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, [validateUserSession]);

  return (
    // 🔑 ADD validateUserSession TO THE VALUE PROP BELOW
    <AuthContext.Provider value={{ user, token, loading, login, logout, validateUserSession }}>
      {children}
    </AuthContext.Provider>
  );
};