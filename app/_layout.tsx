import { Stack } from "expo-router";
import { AuthProvider } from '../src/context/AuthContext';


export default function RootLayout() {
  return (
    <AuthProvider>

      <Stack initialRouteName="login">
        <Stack.Screen
          name="login"
          options={{ headerShown: false }}
        />
      </Stack>
    </AuthProvider>
  );
}
