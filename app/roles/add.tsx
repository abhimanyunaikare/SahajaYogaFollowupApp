import React, { useEffect, useState } from "react";
import { View, TextInput, Text, Button, StyleSheet, Alert, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import api from "../../src/api/apiClient";

export default function AddRoleScreen() {
  const [form, setForm] = useState({ name: "", permissions: [] });
  const [permissions, setPermissions] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await api.get("/permissions");
        setPermissions(response.data);
      } catch (error) {
        console.log("Error fetching permissions:", error.message);
      }
    };
    fetchPermissions();
  }, []);

  const togglePermission = (id) => {
    setForm((prev) => {
      const exists = prev.permissions.includes(id);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((pid) => pid !== id)
          : [...prev.permissions, id],
      };
    });
  };

  const handleSubmit = async () => {
    try {
      await api.post("/roles", form);
      Alert.alert("Success", "Role added successfully!");
      router.replace("/roles");
    } catch (error) {
      console.error("Error adding role:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to add role");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Role</Text>

      <TextInput
        style={styles.input}
        placeholder="Role Name"
        value={form.name}
        onChangeText={(text) => setForm({ ...form, name: text })}
      />

      <Text style={styles.subtitle}>Select Permissions:</Text>
      {permissions.map((perm) => (
        <TouchableOpacity
          key={perm.id}
          style={styles.checkboxContainer}
          onPress={() => togglePermission(perm.id)}
        >
          <View style={[styles.checkbox, form.permissions.includes(perm.id) && styles.checkedBox]} />
          <Text>{perm.name}</Text>
        </TouchableOpacity>
      ))}

      <Button title="Save Role" onPress={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  subtitle: { fontSize: 16, fontWeight: "600", marginVertical: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 4,
    marginRight: 10,
  },
  checkedBox: { backgroundColor: "#007AFF" },
});
