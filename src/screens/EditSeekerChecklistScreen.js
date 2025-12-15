import React, { useState, useEffect, useCallback, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter , useNavigation} from "expo-router";
import api from "../api/apiClient";
import { FontAwesome5 } from '@expo/vector-icons'; // Assuming you have vector icons installed

// Helper component for ordinal numbers (1st, 2nd, 3rd, 4th)
const getOrdinal = (n) => {
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    if (n === 4) return '4th';
    return `${n}th`;
};

// 💅 Optimized ChecklistSwitch Component
const ChecklistSwitch = ({ label, value, onChange, isLast }) => (
  <View style={[styles.switchRow, isLast && styles.noBorder]}>
    <Text style={styles.switchLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onChange}
      thumbColor={value ? "#007AFF" : "#F5F5F5"}
      trackColor={{ false: "#D1D1D6", true: "#A0C8F9" }}
    />
  </View>
);

// 💅 Optimized Switch and Comment Group Component
const SwitchAndComment = ({ label, switchValue, onSwitchChange, commentValue, onCommentChange, ordinal }) => (
  <View style={styles.groupContainer}>
    <ChecklistSwitch
      label={label}
      value={switchValue}
      onChange={onSwitchChange}
    />
    <TextInput
      style={styles.commentInput}
      placeholder={`${ordinal} Comments (Optional)`}
      placeholderTextColor="#A0A0A0"
      value={commentValue || ""}
      onChangeText={onCommentChange}
      multiline={true} // Allow multiple lines for comments
      numberOfLines={3}
    />
  </View>
);


export default function EditChecklistScreen() {
  // ... (unchanged state and hooks)
  const { id, name } = useLocalSearchParams(); 
  const router = useRouter();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState({});

  const handleChange = (key, value) => {
    setChecklist(prev => ({
      ...prev,
      [key]: value,
    }));
  };
  
  useEffect(() => {
    const fetchChecklist = async () => {
      try {
        const response = await api.get(`/seekers/${id}/checklist`);
  
        const data = response.data || {};

        // Convert 0/1 to true/false
        const normalized = Object.fromEntries(
          Object.entries(data).map(([key, value]) => [
            key,
            value === 1 ? true :
            value === 0 ? false :
            value ?? ""
          ])
        );
                
        setChecklist(prev => ({ ...prev, ...normalized }));
  
      } catch (error) {
        console.error(error.response?.data || error.message);
        Alert.alert("Error", "Failed to load checklist");
      } finally {
        setLoading(false);
      }
    };
  
    fetchChecklist();
  }, [id]);
  
  const handleSave = useCallback(async () => {
    Keyboard.dismiss(); // Dismiss keyboard before navigation
    try {
      await api.put(`/seekers/${id}/checklist`, checklist);
      Alert.alert("Success", "Checklist updated successfully!");
      router.replace(`/seekers`);
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert("Error", "Failed to update checklist");
    }
  }, [id, checklist, router]);


  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Edit ${name}'s Checklist`,
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Save</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleSave, name]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
      <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, backgroundColor: "#F2F2F7" }} // Light grey background for the whole screen
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 150 }} 
          keyboardShouldPersistTaps="handled" 
        >
          {/* Pratishthan Sessions */}
          <View style={styles.cardPratishthan}>
            <Text style={styles.sectionTitle}>
                <FontAwesome5 name="seedling" size={18} color="#007AFF" /> PRATISHTHAN SESSIONS
            </Text>

            {[1, 2, 3, 4].map((n) => (
                <SwitchAndComment
                    key={`session-${n}`}
                    label={`Attended ${getOrdinal(n)} Session`}
                    ordinal={getOrdinal(n)}
                    switchValue={checklist[`attended_session_${n}`]}
                    onSwitchChange={(val) => handleChange(`attended_session_${n}`, val)}
                    commentValue={checklist[`session_${n}_comments`]}
                    onCommentChange={(text) => handleChange(`session_${n}_comments`, text)}
                />
            ))}
          </View>

          {/* General Checklist & Monthly Follow-up */}
          <View style={styles.cardFollowUp}>
            <Text style={styles.sectionTitle}>
                <FontAwesome5 name="list-ul" size={18} color="#2ECC71" /> GENERAL CHECKLIST
            </Text>

            <ChecklistSwitch
              label="Feeling Vibrations"
              value={checklist.feeling_vibrations}
              onChange={(val) => handleChange("feeling_vibrations", val)}
            />

            <ChecklistSwitch
              label="Attended Centre"
              value={checklist.attended_centres}
              onChange={(val) => handleChange("attended_centres", val)}
            />

            <ChecklistSwitch
              label="Attended Seminar"
              value={checklist.attended_seminar}
              onChange={(val) => handleChange("attended_seminar", val)}
            />

            <ChecklistSwitch
              label="Attended Puja"
              value={checklist.attended_puja}
              onChange={(val) => handleChange("attended_puja", val)}
              isLast={true}
            />
          </View>

          <View style={styles.cardFollowUp}>
            <Text style={styles.sectionTitle}>
                <FontAwesome5 name="calendar-alt" size={18} color="#E67E22" /> MONTHLY FOLLOW-UP
            </Text>

            {[1, 2, 3, 4].map((n, index) => (
              <SwitchAndComment
                key={`month-${n}`}
                label={`Attended ${getOrdinal(n)} Month`}
                ordinal={getOrdinal(n)}
                switchValue={checklist[`month_${n}`]}
                onSwitchChange={(val) => handleChange(`month_${n}`, val)}
                commentValue={checklist[`month_${n}_comments`]}
                onCommentChange={(text) => handleChange(`month_${n}_comments`, text)}
                isLast={index === 3}
              />
            ))}
          </View>

          </ScrollView>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, padding: 10 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  // --- Card Styles (Optimized) ---
  cardPratishthan: {
    backgroundColor: "#EBF5FF", // Light Blue/Sky color
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#D0E6FF',
  },
  cardFollowUp: {
    backgroundColor: "#FFFFFF", // Clean White
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: { 
    fontSize: 17, 
    fontWeight: "700", 
    marginBottom: 15, 
    color: "#333",
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
  },

  // --- Switch Row Styles ---
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D1D1D6",
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  switchLabel: { 
    fontSize: 16, 
    color: "#2C2C2E", 
    fontWeight: '400',
    flex: 1, 
    marginRight: 10 
  },
  
  // --- Grouped Switch & Comment Styles ---
  groupContainer: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  commentInput: {
    backgroundColor: "#F9F9F9",
    padding: 10,
    paddingTop: 10, // Ensure text starts at the top for multiline
    fontSize: 15,
    color: "#4A4A4A",
    borderTopWidth: 1,
    borderTopColor: '#D1D1D6',
    minHeight: 70, // Increased height for better comment visibility
    textAlignVertical: 'top', // Align text to the top for Android multiline
  },

  // --- Header Button Styles ---
  headerButton: {
    marginRight: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  headerButtonText: {
    color: "#007AFF", 
    fontSize: 16,
    fontWeight: "600",
  },
  // Existing loader style
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});