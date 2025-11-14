import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter, Stack } from "expo-router";
import api from "../../src/api/apiClient";
import { Ionicons } from "@expo/vector-icons";

export default function AddUserScreen() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    zone_id: "",
    role_id: "",
  });
  const [roles, setRoles] = useState([]);
  const [zones, setZones] = useState([]);
  const router = useRouter();

  const handleChange = (key, value) => setForm({ ...form, [key]: value });

  // ✅ Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get("/roles");
        setRoles(response.data);
      } catch (error) {
        console.log("Error fetching roles:", error.message);
      }
    };
    fetchRoles();
  }, []);

  // ✅ Fetch zones
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await api.get("/zones");
        setZones(response.data);
      } catch (error) {
        console.log("Error fetching zones:", error.message);
      }
    };
    fetchZones();
  }, []);

  // ✅ Submit handler
  const handleSubmit = async () => {
    try {
      const dataToSend = {
        ...form,
        role_id: form.role_id ? Number(form.role_id) : null,
      };

      await api.post("/users", dataToSend);
      Alert.alert("Success", "User added successfully!");
      router.replace("/users");
    } catch (error) {
      console.error("Error adding user:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to add user");
    }
  };

  return (
    <>
    <Stack.Screen options={{ title: "Add New User" }} />

    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* <Text style={styles.title}>Add New User</Text> */}

            {/* 👤 Name */}
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={20} color="#555" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={form.name}
                onChangeText={(text) => handleChange("name", text)}
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

            {/* 🔒 Password */}
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color="#555" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={form.password}
                onChangeText={(text) => handleChange("password", text)}
              />
            </View>

            {/* 🎭 Role */}
            <Text style={styles.label}>Select Role</Text>
            <View style={styles.pickerContainer}>
              <Ionicons name="briefcase-outline" size={20} color="#555" style={styles.icon} />
              <Picker
                selectedValue={form.role_id}
                onValueChange={(value) => handleChange("role_id", value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Role" value="" />
                {roles.map((role) => (
                  <Picker.Item key={role.id} label={role.name} value={String(role.id)} />
                ))}
              </Picker>
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

            <Button title="Save User" onPress={handleSubmit} />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
    </>

  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 80,
  },
  container: { flex: 1, padding: 15, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
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
  label: {
    marginBottom: 5,
    fontWeight: "600",
    color: "#333",
  },
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
});
