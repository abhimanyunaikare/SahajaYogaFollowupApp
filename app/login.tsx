import React, { useState, useContext, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import api from '../src/api/apiClient';
import { AuthContext } from '../src/context/AuthContext';
import { useRouter } from 'expo-router';
import type { AxiosError } from 'axios';

export default function LoginScreen() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const { user, login, loading } = useContext(AuthContext);
  const router = useRouter();


  useEffect(() => {
    if (!loading && user) {
      router.replace('/home'); // ✅ auto-redirect to home if already logged in
    }
  }, [loading, user]);

  const handleLogin = async () => {
    try {
      const response = await api.post('/login', { mobile, password });
      await login(response.data.token, response.data.user);
      router.replace('/home');
    } catch (error) {
      const err = error as AxiosError;
      console.error('Login failed:', err.response?.data || err.message);
      Alert.alert('Login Failed', 'Check mobile or password');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Sahaja Yoga Follow Up</Text>

          <TextInput
            style={styles.input}
            placeholder="Mobile"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            returnKeyType="next"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
          />

          <Button title="Login" onPress={handleLogin} />

          <Text style={styles.link} onPress={() => router.push('/register')}>
            Create an Account
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginVertical: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  link: { color: '#007AFF', textAlign: 'center', marginTop: 15, fontWeight: '500' },
});
