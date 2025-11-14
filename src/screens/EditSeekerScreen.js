import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  Alert,
  StyleSheet,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/apiClient";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";

export default function EditSeekerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    address: "",
    city: "", // default value
    zone_id: "",
    type: "1",
    occupation: "",
    interested_in_followup: false,
    called: false,
  });

  const handleChange = (key, value) => setForm({ ...form, [key]: value });

  // ✅ Fetch seeker details + zones
  useEffect(() => {
    const fetchSeeker = async () => {
      try {
        const response = await api.get(`/seekers/${id}`);
        const seeker = response.data;
        setForm({
          ...form,
          ...seeker,
          zone_id: seeker.zone_id ? String(seeker.zone_id) : "",
          city: seeker.city || "Pune",
        });
      } catch (error) {
        console.log(error.response?.data || error.message);
        Alert.alert("Error", "Unable to load seeker details");
      } finally {
        setLoading(false);
      }
    };

    const fetchZones = async () => {
      try {
        const response = await api.get("/zones");
        setZones(response.data);
      } catch (error) {
        console.log("Error fetching zones:", error.message);
      }
    };

    fetchZones();
    fetchSeeker();
  }, [id]);

  // ✅ Update seeker
  const handleUpdate = async () => {
    try {
      await api.put(`/seekers/${id}`, {
        ...form,
        zone_id: form.zone_id ? Number(form.zone_id) : null,
      });
      Alert.alert("Success", "Seeker updated successfully!");
      router.replace("/seekers");
    } catch (error) {
      console.log(error.response?.data || error.message);
      Alert.alert("Error", "Failed to update seeker.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading seeker data...</Text>
      </View>
    );
  }

  return (

    <>
    <Stack.Screen options={{ title: "Edit Seeker Details" }} />

    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >

        {/* 🧍 First Name */}
        <View style={styles.inputRow}>
          <Ionicons name="person-outline" size={20} color="#555" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={form.first_name}
            onChangeText={(text) => handleChange("first_name", text)}
          />
        </View>

        {/* 🧍‍♂️ Last Name */}
        <View style={styles.inputRow}>
          <Ionicons name="person-circle-outline" size={20} color="#555" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={form.last_name}
            onChangeText={(text) => handleChange("last_name", text)}
          />
        </View>

        {/* ✉️ Email */}
        <View style={styles.inputRow}>
          <Ionicons name="mail-outline" size={20} color="#555" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={form.email}
            onChangeText={(text) => handleChange("email", text)}
          />
        </View>

        {/* 📱 Mobile */}
        <View style={styles.inputRow}>
          <Ionicons name="call-outline" size={20} color="#555" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Mobile"
            keyboardType="phone-pad"
            value={form.mobile}
            onChangeText={(text) => handleChange("mobile", text)}
          />
        </View>

        {/* 🏠 Address */}
        <View style={styles.inputRow}>
          <Ionicons name="home-outline" size={20} color="#555" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={form.address}
            onChangeText={(text) => handleChange("address", text)}
          />
        </View>

        {/* 🏙 City */}
        <View style={styles.inputRow}>
          <Ionicons name="business-outline" size={20} color="#555" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="City"
            value={form.city}
            onChangeText={(text) => handleChange("city", text)}
          />
        </View>

        {/* 🌍 Zone */}
        <Text style={styles.label}>Select Zone</Text>
        <View style={styles.pickerContainer}>
          <Ionicons name="location-outline" size={20} color="#555" style={styles.icon} />
          <Picker
            selectedValue={form.zone_id}
            onValueChange={(value) => handleChange("zone_id", value)}
            style={styles.picker}
          >
            <Picker.Item label="Select Zone" value="" />
            {zones.map((zone) => (
              <Picker.Item key={zone.id} label={zone.name} value={String(zone.id)} />
            ))}
          </Picker>
        </View>

        {/* 💼 Occupation */}
        <View style={styles.inputRow}>
          <Ionicons name="briefcase-outline" size={20} color="#555" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Occupation"
            value={form.occupation}
            onChangeText={(text) => handleChange("occupation", text)}
          />
        </View>

        {/* 🌟 Interested in Follow-up */}
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Interested in Follow-up</Text>
          <View style={styles.switchWithSides}>
            <Text
              style={[styles.sideText, !form.interested_in_followup && styles.activeOff]}
            >
              No
            </Text>
            <Switch
              value={form.interested_in_followup}
              onValueChange={(val) => handleChange("interested_in_followup", val)}
              thumbColor={form.interested_in_followup ? "#2196F3" : "#f4f3f4"}
              trackColor={{ false: "#ccc", true: "#81b0ff" }}
            />
            <Text style={[styles.sideText, form.interested_in_followup && styles.activeOn]}>
              Yes
            </Text>
          </View>
        </View>

        {/* 🌟 Seeker called by Callling Team */}
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Seeker Called</Text>
          <View style={styles.switchWithSides}>
            <Text
              style={[styles.sideText, !form.called && styles.activeOff]}
            >
              No
            </Text>
            <Switch
              value={form.called}
              onValueChange={(val) => handleChange("called", val)}
              thumbColor={form.called ? "#2196F3" : "#f4f3f4"}
              trackColor={{ false: "#ccc", true: "#81b0ff" }}
            />
            <Text style={[styles.sideText, form.called && styles.activeOn]}>
              Yes
            </Text>
          </View>
        </View>

        <Button title="Update Seeker" onPress={handleUpdate} />
      </ScrollView>
    </KeyboardAvoidingView>

    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 8 },
  label: { marginBottom: 5, fontWeight: "600", color: "#333" },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  picker: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  switchContainer: { marginBottom: 20 },
  switchWithSides: { flexDirection: "row", alignItems: "center" },
  sideText: { fontSize: 14, color: "#999", marginHorizontal: 6 },
  activeOn: { color: "#2196F3", fontWeight: "600" },
  activeOff: { color: "#f44336", fontWeight: "600" },
});
