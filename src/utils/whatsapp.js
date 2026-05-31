import { Linking, Alert } from "react-native";

/**
 * Opens WhatsApp with a pre-filled message for a single number.
 * @param {string} mobile - 10-digit Indian mobile number
 * @param {string} message - Pre-filled message text
 */
export const openWhatsApp = async (mobile, message = "") => {
  const phone = `91${mobile}`; // India country code
  const encodedMsg = encodeURIComponent(message);
  const url = `whatsapp://send?phone=${phone}&text=${encodedMsg}`;

  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    Alert.alert("WhatsApp Not Found", "Please install WhatsApp to use this feature.");
    return;
  }
  await Linking.openURL(url);
};

/**
 * For bulk: opens WhatsApp one at a time with a delay.
 * On mobile you can only deep-link one at a time.
 */
export const openWhatsAppBulk = (mobiles, message = "") => {
  if (mobiles.length === 0) return;

  Alert.alert(
    "Send WhatsApp Messages",
    `This will open WhatsApp for each of the ${mobiles.length} selected seeker(s) one by one. Continue?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Start",
        onPress: () => {
          let index = 0;
          const sendNext = async () => {
            if (index >= mobiles.length) return;
            await openWhatsApp(mobiles[index], message);
            index++;
            // 3 second gap so user can send/close before next one opens
            setTimeout(sendNext, 3000);
          };
          sendNext();
        },
      },
    ]
  );
};