import { Stack } from "expo-router";
import { AuthProvider, AuthContext } from '../src/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useContext } from "react";
import { usePushNotifications } from "../src/hooks/usePushNotifications";

// Inner component — lives inside AuthProvider so it can access user from context
function AppLayout() {
  const { user } = useContext(AuthContext);

  // Registers device for push notifications and saves token to backend
  // Runs automatically whenever user logs in (userId changes)
  usePushNotifications(user?.id);

  return (
    <Stack initialRouteName="login">
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </SafeAreaProvider>
  );
}