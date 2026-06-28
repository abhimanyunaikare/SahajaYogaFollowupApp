// src/hooks/usePushNotifications.js

import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import api from "../api/apiClient";


// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications(userId) {
  useEffect(() => {
    if (!userId) return;

    // Retry up to 5 times with 3s delay — FCM token fetch can fail
    // on first app launch while Google Play Services warms up
    let attempts = 0;
    const maxAttempts = 5;
    const retryDelay = 3000;

    const tryRegister = async () => {
      attempts++;
      const success = await registerForPushNotifications(userId);
      if (!success && attempts < maxAttempts) {
        console.log(`Push token attempt ${attempts} failed, retrying in 3s...`);
        setTimeout(tryRegister, retryDelay);
      }
    };

    // Small initial delay to let Google Play Services fully start
    setTimeout(tryRegister, 2000);
  }, [userId]);
}

// Returns true on success, false on failure (so retry logic knows)
async function registerForPushNotifications(userId) {
  try {
    if (!Device.isDevice) {
      console.log("Push notifications require a physical device.");
      return true; // no point retrying on emulator
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission denied.");
      return true; // no point retrying if user denied
    }

    // Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#007AFF",
      });
    }

    // Get Expo push token — this is what fails with SERVICE_NOT_AVAILABLE
    // ⚠️ Replace YOUR_EXPO_PROJECT_ID with your actual EAS project ID

    // const tokenData = await Notifications.getExpoPushTokenAsync({
    //   projectId: "6ebf176f-2856-4d16-8cc8-8c09d1abfaa0", 
    // });

    const tokenData = await Notifications.getDevicePushTokenAsync();

    const token = tokenData.data;
    console.log("Push token obtained:", token);

    // Save to backend
    await api.post("/users/push-token", { push_token: token });
    console.log("Push token saved successfully.");
    return true;

  } catch (e) {
    console.log("Push token error:", e.message);
    return false; // signal retry
  }
}