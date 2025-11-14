import React, { useEffect, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import api from "../../../src/api/apiClient";

export default function EditUserScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    role_id: "",
    zone_id: "",
  });

  const [roles, setRoles] = useState([]);
  const [zones, setZones] = useState([]);

  const handleChange = (key: string, value: any) => {
    setForm({ ...form, [key]: value });
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        const userData = res.data;

        setForm({
          name: userData.name || "",
          email: userData.email || "",
          mobile: userData.mobile || "",
          role_id: userData.role_id ? String(userData.role_id) : "",
          zone_id: userData.zone_id ? String(userData.zone_id) : "",
        });
      } catch (error) {
        Alert.alert("Error", "Failed to fetch user details");
      }
    };

    const fetchRoles = async () => {
      try {
        const response = await api.get("/roles");
        setRoles(response.data);
      } catch (error) {
        console.log("Error fetching roles:", error.message);
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

    fetchUser();
    fetchRoles();
    fetchZones();
  }, [id]);

  const handleUpdate = async () => {
    try {
      const updatedData = {
        ...form,
        role_id: form.role_id ? Number(form.role_id) : null,
        zone_id: form.zone_id ? Number(form.zone_id) : null,
      };

      await api.put(`/users/${id}`, updatedData);
      Alert.alert("Success", "User updated successfully!");
      router.replace("/users");
    } catch (error) {
      Alert.alert("Error", "Failed to update user");
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Edit User" }} />

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
            

            {/* 👤 Name */}
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={20} color="#555" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={form.name}
                onChangeText={(value) => handleChange("name", value)}
              />
            </View>

            {/* ✉️ Email */}
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={20} color="#555" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={form.email}
                onChangeText={(value) => handleChange("email", value)}
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
                onChangeText={(value) => handleChange("mobile", value)}
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

            <Button title="Save Changes" onPress={handleUpdate} />
          </View>

          </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#007AFF",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
  },
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
  picker: {
    flex: 1,
  },
});
