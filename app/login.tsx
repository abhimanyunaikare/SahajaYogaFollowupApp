import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import api from '../src/api/apiClient';
import { AuthContext } from '../src/context/AuthContext';
import { useRouter } from 'expo-router';
import type { AxiosError } from 'axios';

// --- Constants ---
const PRIMARY_COLOR = "#007AFF"; 
const TEXT_COLOR = "#1F2937";
const BACKGROUND_COLOR = "#F9F9FB";
const INPUT_BORDER_COLOR = "#D1D5DB";

export default function LoginScreen() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Local state for managing the login button's loading/disabled state
  const [buttonLoading, setButtonLoading] = useState(false); 
  
  // Destructure state and functions from AuthContext
  const { user, login, loading } = useContext(AuthContext); 
  const router = useRouter();

  // --- Auto-redirect on successful login ---
  useEffect(() => {
    // Check if global session loading is complete AND user object exists
    if (!loading && user) {
      // ✅ FIX: Reverting to the original working route
      router.replace('/home'); 
    }
  }, [loading, user]);

  const handleLogin = async () => {
    if (!mobile || !password) {
      Alert.alert("Error", "Please enter both mobile number and password.");
      return;
    }
    
    setButtonLoading(true);

    try {
      const response = await api.post('/login', { mobile, password });
      
      // Call AuthContext login function to save token and user data
      await login(response.data.token, response.data.user);
      
      // ✅ FIX: Reverting to the original working route
      router.replace('/home'); 

    } catch (error) {
      const err = error as AxiosError;
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (err.response) {
        const status = err.response.status;
        const data = err.response.data as { message?: string, error?: string };
        
        if (data.message || data.error) {
            errorMessage = data.message || data.error;
        } else if (status === 401) {
            errorMessage = 'Invalid mobile number or password.';
        } else {
            errorMessage = `Server Error: Status ${status}.`;
        }
      } else if (err.request) {
        errorMessage = 'Network error: Could not connect to the server.';
      }

      Alert.alert('Login Failed', errorMessage);
    }
    
    // Reset local button loading state regardless of success or failure
    setButtonLoading(false);
  };

  // --- Initial Loading Screen ---
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND_COLOR }}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={{ marginTop: 10, color: PRIMARY_COLOR }}>Loading user session...</Text>
      </View>
    );
  }
  
  // --- Optimized UI ---
  return (
    <KeyboardAvoidingView
      style={styles.flexContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
            
          <View style={styles.logoContainer}>
              <Ionicons name="people-circle-outline" size={100} color={PRIMARY_COLOR} />
              <Text style={styles.title}>Sahaja Yoga Seeker Follow Up</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>
          
          {/* Mobile Input */}
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              placeholderTextColor="#A0A0A0"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              returnKeyType="next"
              editable={!buttonLoading} 
            />
          </View>

          {/* Password Input with Toggle */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#A0A0A0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword} 
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!buttonLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
              disabled={buttonLoading}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>
          
          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={buttonLoading}
          >
            {buttonLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>LOG IN</Text>
            )}
          </TouchableOpacity>
          
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // --- Layout ---
  flexContainer: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 40,
  },
  container: {
    width: '100%',
    alignItems: 'center',
  },
  
  // --- Header/Logo ---
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: PRIMARY_COLOR,
    marginTop: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 5,
  },
  
  // --- Input Fields (Optimized) ---
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: INPUT_BORDER_COLOR,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: TEXT_COLOR,
    padding: 0, 
  },
  passwordToggle: {
    padding: 5,
    marginLeft: 10,
  },
  
  // --- Button (Optimized) ---
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});