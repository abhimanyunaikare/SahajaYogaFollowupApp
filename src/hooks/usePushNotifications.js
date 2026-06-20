// src/hooks/usePushNotifications.js
// Drop this hook into your project and call it once inside your root layout
// or AuthContext after login.

import { useEffect } from "react";
// import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import api from "../api/apiClient";

// Configure how notifications appear when app is in foreground
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// export default function usePushNotifications(userId) {
//   useEffect(() => {
//     if (!userId) return; // Only register when logged in
//     registerForPushNotifications(userId);
//   }, [userId]);
// }

// async function registerForPushNotifications(userId) {
//   // Push notifications only work on real devices
//   if (!Device.isDevice) {
//     console.log("Push notifications require a physical device.");
//     return;
//   }

//   // Request permission
//   const { status: existingStatus } = await Notifications.getPermissionsAsync();
//   let finalStatus = existingStatus;

//   if (existingStatus !== "granted") {
//     const { status } = await Notifications.requestPermissionsAsync();
//     finalStatus = status;
//   }

//   if (finalStatus !== "granted") {
//     console.log("Push notification permission denied.");
//     return;
//   }

//   // Android requires a notification channel
//   if (Platform.OS === "android") {
//     await Notifications.setNotificationChannelAsync("default", {
//       name: "Default",
//       importance: Notifications.AndroidImportance.MAX,
//       vibrationPattern: [0, 250, 250, 250],
//       lightColor: "#007AFF",
//     });
//   }

//   // Get the Expo push token
//   const tokenData = await Notifications.getExpoPushTokenAsync({
//     projectId: "6ebf176f-2856-4d16-8cc8-8c09d1abfaa0", // ⚠️ Replace with your EAS project ID from app.json
//   });
//   const token = tokenData.data;

  // Save token to backend — backend stores it on the users table
  // try {
  //   await api.post("/users/push-token", { push_token: token });
  //   console.log("Push token saved:", token);
  // } catch (e) {
  //   console.log("Failed to save push token:", e.message);
  // }
// }