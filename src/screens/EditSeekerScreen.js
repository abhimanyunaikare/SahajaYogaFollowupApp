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
} from "react-native";
import api from "../api/apiClient";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function EditSeekerScreen() {
  const { id } = useLocalSearchParams(); // get seeker ID from route
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    address: "",
    city: "",
    zone: "",
    type: "1",
    occupation: "",
    interested_in_followup: false,
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  // ✅ Fetch seeker details
  useEffect(() => {
    const fetchSeeker = async () => {
      try {
        const response = await api.get(`/seekers/${id}`);
        setForm(response.data);
      } catch (error) {
        console.log(error.response?.data || error.message);
        Alert.alert("Error", "Unable to load seeker details");
      } finally {
        setLoading(false);
      }
    };
    fetchSeeker();
  }, [id]);

  // ✅ Update seeker
  const handleUpdate = async () => {
    try {
      await api.put(`/seekers/${id}`, form);
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 50 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Edit Seeker</Text>

      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={form.first_name}
        onChangeText={(text) => handleChange("first_name", text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={form.last_name}
        onChangeText={(text) => handleChange("last_name", text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={form.email}
        onChangeText={(text) => handleChange("email", text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Mobile"
        value={form.mobile}
        keyboardType="phone-pad"
        onChangeText={(text) => handleChange("mobile", text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Address"
        value={form.address}
        onChangeText={(text) => handleChange("address", text)}
      />
      <TextInput
        style={styles.input}
        placeholder="City"
        value={form.city}
        onChangeText={(text) => handleChange("city", text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Zone"
        value={form.zone}
        onChangeText={(text) => handleChange("zone", text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Occupation"
        value={form.occupation}
        onChangeText={(text) => handleChange("occupation", text)}
      />

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Interested in Follow-up</Text>
        <View style={styles.switchWithSides}>
          <Text style={[styles.sideText, !form.interested_in_followup && styles.activeOff]}>No</Text>
          <Switch
            value={form.interested_in_followup}
            onValueChange={(val) => handleChange("interested_in_followup", val)}
            thumbColor={form.interested_in_followup ? "#2196F3" : "#f4f3f4"}
            trackColor={{ false: "#ccc", true: "#81b0ff" }}
          />
          <Text style={[styles.sideText, form.interested_in_followup && styles.activeOn]}>Yes</Text>
        </View>
      </View>

      <Button title="Update Seeker" onPress={handleUpdate} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
  },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  switchWithSides: {
    flexDirection: "row",
    alignItems: "center",
  },
  sideText: {
    fontSize: 14,
    color: "#999",
    marginHorizontal: 6,
  },
  activeOn: { color: "#2196F3", fontWeight: "600" },
  activeOff: { color: "#f44336", fontWeight: "600" },
});
