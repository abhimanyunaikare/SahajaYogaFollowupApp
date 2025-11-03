import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Switch,
  Button,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "../api/apiClient";

export default function EditChecklistScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  // const [checklist, setChecklist] = useState(null);


  const [checklist, setChecklist] = useState({
    attended_session_1: false,
    session_1_comments: "",
    attended_session_2: false,
    session_2_comments: "",
    attended_session_3: false,
    session_3_comments: "",
    attended_session_4: false,
    session_4_comments: "",
    feeling_vibrations: false,
    attended_centres: false,
    attended_seminar: false,
    attended_puja: false,
    month_1: false,
    month_1_comments: "",
    month_2: false,
    month_2_comments: "",
    month_3: false,
    month_3_comments: "",
    month_4: false,
    month_4_comments: "",
  });
  

  useEffect(() => {
    const fetchChecklist = async () => {
      try {
        const response = await api.get(`/seekers/${id}/checklist`);
        // setChecklist(response.data[0]); // assuming array with one checklist object
        const data = response.data.checklist?.[0] || {};
        setChecklist((prev) => ({ ...prev, ...data }));
      } catch (error) {
        console.log(error.response?.data || error.message);
        Alert.alert("Error", "Failed to load checklist");
      } finally {
        setLoading(false);
      }
    };
    fetchChecklist();
  }, [id]);

  const handleChange = (key, value) => {
    setChecklist({ ...checklist, [key]: value });
  };

  const handleSave = async () => {
    try {
      await api.put(`/seekers/${id}/checklist`, checklist);
      Alert.alert("Success", "Checklist updated successfully!");
      router.back();
    } catch (error) {
      console.log(error.response?.data || error.message);
      Alert.alert("Error", "Failed to update checklist");
    }
  };


  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={styles.title}>Edit Seeker Checklist</Text>

      {/* Pratishthan Sessions */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>PRATISHTHAN SESSIONS</Text>

        <View>
          <View>
            <ChecklistSwitch
              label="Attended 1st Session"
              value={checklist.attended_session_1}
              onChange={(val) => handleChange("attended_session_1", val)}
            />
            <TextInput
              style={styles.input}
              placeholder="1st Session Comments"
              value={checklist.session_1_comments || ""}
              onChangeText={(text) => handleChange("session_1_comments", text)}
            />
          </View>

          <View>
            <ChecklistSwitch
              label="Attended 2nd Session"
              value={checklist.attended_session_2}
              onChange={(val) => handleChange("attended_session_2", val)}
            />
            <TextInput
              style={styles.input}
              placeholder="2nd Session Comments"
              value={checklist.session_2_comments || ""}
              onChangeText={(text) => handleChange("session_2_comments", text)}
            />
          </View>

          <View>
            <ChecklistSwitch
              label="Attended 3rd Session"
              value={checklist.attended_session_3}
              onChange={(val) => handleChange("attended_session_3", val)}
            />
            <TextInput
              style={styles.input}
              placeholder="3rd Session Comments"
              value={checklist.session_3_comments || ""}
              onChangeText={(text) => handleChange("session_3_comments", text)}
            />
          </View>

          <View>
            <ChecklistSwitch
              label="Attended 4th Session"
              value={checklist.attended_session_4}
              onChange={(val) => handleChange("attended_session_4", val)}
            />
            <TextInput
              style={styles.input}
              placeholder="4th Session Comments"
              value={checklist.session_4_comments || ""}
              onChangeText={(text) => handleChange("session_4_comments", text)}
            />
          </View>
        </View>

      </View>

      {/* General Checklist */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>FOLLOW-UP CHECKLIST</Text>

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
        />

        {[1, 2, 3, 4].map((n) => (
          <View key={n}>
            <ChecklistSwitch
              label={`Attended ${n}ᵗʰ Month`}
              value={checklist[`month_${n}`]}
              onChange={(val) => handleChange(`month_${n}`, val)}
            />
            <TextInput
              style={styles.input}
              placeholder={`${n}ᵗʰ Month Comments`}
              value={checklist[`month_${n}_comments`] || ""}
              onChangeText={(text) => handleChange(`month_${n}_comments`, text)}
            />
          </View>
        ))}
      </View>

      <Button title="Save Checklist" onPress={handleSave} />
    </ScrollView>
  );
}

const ChecklistSwitch = ({ label, value, onChange }) => (
  <View style={styles.section}>
    <Text style={styles.label}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onChange}
      thumbColor={value ? "#2196F3" : "#f4f3f4"}
      trackColor={{ false: "#ccc", true: "#81b0ff" }}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#007AFF" },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  label: { fontSize: 16, flex: 1, marginRight: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
});
