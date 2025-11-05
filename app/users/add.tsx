import React, { useState, useEffect } from "react";
import { View, TextInput, Text, Button, StyleSheet, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import api from "../../src/api/apiClient";

export default function AddUserScreen() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    role_id: "",
  });
  const [roles, setRoles] = useState([]);
  const router = useRouter();

  const handleChange = (key, value) => setForm({ ...form, [key]: value });

  // ✅ Fetch roles when screen loads
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

  // ✅ Submit handler
  const handleSubmit = async () => {
    try {
      const dataToSend = {
        ...form,
        role_id: form.role_id ? Number(form.role_id) : null, // ensure numeric role_id
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
    <View style={styles.container}>
      <Text style={styles.title}>Add New User</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={form.name}
        onChangeText={(text) => handleChange("name", text)}
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
        onChangeText={(text) => handleChange("mobile", text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={form.password}        
        onChangeText={(text) => handleChange("password", text)}
      />

      <Text style={{ marginBottom: 5 }}>Select Role</Text>
      <Picker
        selectedValue={form.role_id}
        onValueChange={(value) => handleChange("role_id", value)}
        style={{ borderWidth: 1, borderColor: "#ccc", marginBottom: 20 }}
      >
        <Picker.Item label="Select Role" value="" />
        {roles.map((role) => (
          <Picker.Item key={role.id} label={role.name} value={String(role.id)} />
        ))}
      </Picker>

      <Button title="Save User" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
});
