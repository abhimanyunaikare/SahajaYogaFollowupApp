import React, { useEffect, useState } from "react";
import { View, TextInput, Text, Button, StyleSheet, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import api from "../../../src/api/apiClient";

export default function EditUserScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", mobile: "", role_id: "" });
  const [roles, setRoles] = useState([]);

  const handleChange = (key: string, value: any) => {
    setForm({ ...form, [key]: value });
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        const userData = res.data;
        // ensure role_id is string for Picker consistency
        setForm({
          ...userData,
          role_id: userData.role_id ? String(userData.role_id) : "",
        });
      } catch (error) {
        Alert.alert("Error", "Failed to fetch user");
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
  
    fetchUser();
    fetchRoles();
  }, [id]);
  

  
 const handleUpdate = async () => {
  try {
    const updatedData = {
      ...form,
      role_id: form.role_id ? Number(form.role_id) : null,
    };
    await api.put(`/users/${id}`, updatedData);
    Alert.alert("Success", "User updated successfully!");
    router.replace("/users");
  } catch (error) {
    Alert.alert("Error", "Failed to update user");
  }
};


  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Edit User</Text>

      <Text>Name</Text>
      <TextInput
        value={form.name}
        onChangeText={(value) => handleChange("name", value)}
        style={{ borderWidth: 1, borderColor: "#ccc", marginBottom: 10, padding: 8 }}
      />

      <Text>Email</Text>
      <TextInput
        value={form.email}
        onChangeText={(value) => handleChange("email", value)}
        style={{ borderWidth: 1, borderColor: "#ccc", marginBottom: 10, padding: 8 }}
      />

      <Text>Mobile</Text>
      <TextInput
        value={form.mobile}
        onChangeText={(value) => handleChange("mobile", value)}
        style={{ borderWidth: 1, borderColor: "#ccc", marginBottom: 10, padding: 8 }}
      />

      <Text>Role</Text>
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


      <Button title="Save Changes" onPress={handleUpdate} />
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
