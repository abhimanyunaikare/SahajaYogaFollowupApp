import React, { useEffect, useState } from "react";
import { View, TextInput, Text, Button, StyleSheet, Alert, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import api from "../../src/api/apiClient";

export default function AddZoneScreen() {
  const [form, setForm] = useState({ name: "" });
  const router = useRouter();

  
  const handleSubmit = async () => {
    try {
      await api.post("/zones", form);
      Alert.alert("Success", "Zone added successfully!");
      router.replace("/zone");
    } catch (error) {
      console.log("Error adding seeker:", error.response?.data || error.message);
  
      const errorMessage = 
          error.response?.data?.message || 
          error.response?.data?.error || 
          error.message || 
          "Something went wrong";
  
      Alert.alert("Error", errorMessage);
  }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Zone</Text>

      <TextInput
        style={styles.input}
        placeholder="Zone Name"
        value={form.name}
        onChangeText={(text) => setForm({ ...form, name: text })}
      />

      <Button title="Save Zone" onPress={handleSubmit} />
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
