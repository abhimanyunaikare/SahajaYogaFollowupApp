import React, { useState } from "react";
import {
  View, Text, Modal, TouchableOpacity,
  TextInput, ScrollView, StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WHATSAPP_TEMPLATES } from "../utils/whatsappTemplates";
import { openWhatsAppBulk } from "../utils/whatsapp";

const PRIMARY_COLOR = "#007AFF";
const WHATSAPP_COLOR = "#25D366";

export default function WhatsAppModal({ visible, onClose, selectedSeekers, seekers }) {
  const [selectedTemplate, setSelectedTemplate] = useState(WHATSAPP_TEMPLATES[0].id);
  const [customMessage, setCustomMessage] = useState("");

  const selectedMobiles = seekers
    .filter((s) => selectedSeekers.includes(s.id))
    .map((s) => s.mobile)
    .filter(Boolean);

  const currentMessage =
    selectedTemplate === "custom"
      ? customMessage
      : WHATSAPP_TEMPLATES.find((t) => t.id === selectedTemplate)?.message || "";

  const handleSend = () => {
    if (!currentMessage.trim()) {
      alert("Please enter or select a message.");
      return;
    }
    onClose();
    // slight delay so modal closes before WhatsApp opens
    setTimeout(() => {
      openWhatsAppBulk(selectedMobiles, currentMessage);
    }, 400);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="logo-whatsapp" size={22} color={WHATSAPP_COLOR} />
              <Text style={styles.headerTitle}>Send WhatsApp</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
          </View>

          {/* Recipient count */}
          <View style={styles.recipientBanner}>
            <Ionicons name="people-outline" size={15} color="#065f46" />
            <Text style={styles.recipientText}>
              {selectedMobiles.length} recipient{selectedMobiles.length !== 1 ? "s" : ""} selected
            </Text>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

            {/* Template Picker */}
            <Text style={styles.sectionLabel}>Choose Template</Text>
            {WHATSAPP_TEMPLATES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.templateOption,
                  selectedTemplate === t.id && styles.templateSelected,
                ]}
                onPress={() => setSelectedTemplate(t.id)}
              >
                <Ionicons
                  name={selectedTemplate === t.id ? "radio-button-on" : "radio-button-off"}
                  size={18}
                  color={selectedTemplate === t.id ? WHATSAPP_COLOR : "#9CA3AF"}
                />
                <Text style={[
                  styles.templateLabel,
                  selectedTemplate === t.id && { color: "#065f46", fontWeight: "700" },
                ]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Message Preview / Custom Input */}
            <Text style={styles.sectionLabel}>Message</Text>
            {selectedTemplate === "custom" ? (
              <TextInput
                style={styles.messageInput}
                placeholder="Type your custom message..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={customMessage}
                onChangeText={setCustomMessage}
              />
            ) : (
              <View style={styles.messagePreview}>
                <Text style={styles.messagePreviewText}>{currentMessage}</Text>
              </View>
            )}

          </ScrollView>

          {/* Send Button */}
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.sendBtnText}>
              Send to {selectedMobiles.length} Seeker{selectedMobiles.length !== 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 15, paddingBottom: 30, maxHeight: "85%",
  },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "#E5E7EB",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  closeBtn: { padding: 4 },
  recipientBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#D1FAE5", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, marginVertical: 12,
  },
  recipientText: { fontSize: 13, color: "#065f46", fontWeight: "600" },
  sectionLabel: {
    fontSize: 13, fontWeight: "700", color: "#374151",
    marginTop: 16, marginBottom: 8,
  },
  templateOption: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB", marginBottom: 8,
  },
  templateSelected: {
    borderColor: "#25D366", backgroundColor: "#F0FDF4",
  },
  templateLabel: { fontSize: 14, color: "#374151" },
  messageInput: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10,
    padding: 12, fontSize: 14, color: "#1F2937",
    backgroundColor: "#F9FAFB", minHeight: 100,
    textAlignVertical: "top",
  },
  messagePreview: {
    backgroundColor: "#F0FDF4", borderRadius: 10,
    borderWidth: 1, borderColor: "#BBF7D0",
    padding: 12,
  },
  messagePreviewText: { fontSize: 14, color: "#065f46", lineHeight: 20 },
  sendBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#25D366",
    paddingVertical: 14, borderRadius: 12, marginTop: 12,
  },
  sendBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});