import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  Button,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/api/apiClient";

export default function AddSeekerScreen() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    mobile: "",
    email: "",
    age: "",
    gender: "",
    city: "Pune",
    zone_id: "",
    type: "", // 1 = Pratishthan, 2 = Public
  });

  const [zones, setZones] = useState([]);
  const router = useRouter();

  const handleChange = (key, value) => setForm({ ...form, [key]: value });

  // ✅ Fetch zones
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await api.get("/zones");
        setZones(res.data);
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
        zone_id: form.zone_id ? String(form.zone_id) : null,
        type: form.type ? Number(form.type) : 0,
      };

      await api.post("/seekers", dataToSend);
      Alert.alert("Success", "Seeker added successfully!");
      router.replace("/seekers");
    } catch (error) {
      console.log("Error adding seeker:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to add seeker");
    }
  };

  return (
    <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={100} // tweak this if needed
  >
    <ScrollView contentContainerStyle={styles.container}>      
    
    <Text style={styles.title}>Add New Seeker</Text>

      {/* 🧍‍♂️ First Name */}
      <View style={styles.inputRow}>
        <Ionicons name="person-outline" size={20} color="#555" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={form.first_name}
          onChangeText={(text) => handleChange("first_name", text)}
        />
      </View>

      {/* 🧍‍♀️ Last Name */}
      <View style={styles.inputRow}>
        <Ionicons name="person-circle-outline" size={20} color="#555" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={form.last_name}
          onChangeText={(text) => handleChange("last_name", text)}
        />
      </View>

      {/* 📞 Mobile */}
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

      {/* 🎂 Age */}
      <View style={styles.inputRow}>
        <Ionicons name="calendar-outline" size={20} color="#555" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Age"
          keyboardType="numeric"
          value={form.age}
          onChangeText={(text) => handleChange("age", text)}
        />
      </View>

      {/* 🚻 Gender */}
      <Text style={styles.label}>Select Gender</Text>
      <View style={styles.pickerContainer}>
        <Ionicons name="man-outline" size={20} color="#555" style={styles.icon} />
        <Picker
          selectedValue={form.gender}
          onValueChange={(value) => handleChange("gender", value)}
          style={styles.picker}
        >
          <Picker.Item label="Select Gender" value="" />
          <Picker.Item label="Male" value="Male" />
          <Picker.Item label="Female" value="Female" />
          <Picker.Item label="Other" value="Other" />
        </Picker>
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

      {/* 🧘‍♂️ Type */}
      <Text style={styles.label}>Seeker Type</Text>
      <View style={styles.pickerContainer}>
        <Ionicons name="people-outline" size={20} color="#555" style={styles.icon} />
        <Picker
          selectedValue={form.type}
          onValueChange={(value) => handleChange("type", value)}
          style={styles.picker}
        >
          <Picker.Item label="Select Type" value="" />
          <Picker.Item label="Pratishthan" value="1" />
          <Picker.Item label="Public" value="2" />
        </Picker>
      </View>

      <Button title="Save Seeker" onPress={handleSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 15,
        backgroundColor: "#fff",
      },
      title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
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
