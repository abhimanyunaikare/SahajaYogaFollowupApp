import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Button,
    ScrollView,
    Alert,
    StyleSheet,
    Switch,
    KeyboardAvoidingView,
    Platform,
    } from "react-native";
    import api from "../api/apiClient";
    import { useRouter } from "expo-router";
    import { Picker } from '@react-native-picker/picker';

    export default function AddSeekerScreen() {
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        mobile: "",
        address: "",
        city: "Pune",
        zone: "",
        type: "1",
        occupation: "",
        followup: false,
    });

    const [errors, setErrors] = useState({});
    const router = useRouter();

    const handleChange = (key, value) => {
        setForm({ ...form, [key]: value });
        setErrors({ ...errors, [key]: "" }); // clear error on input
    };

    const validate = () => {
        const newErrors = {};

        if (!form.first_name.trim()) newErrors.first_name = "First name is required.";
        if (!form.mobile.trim()) newErrors.mobile = "Mobile number is required.";
        else if (!/^\d{10}$/.test(form.mobile))
        newErrors.mobile = "Enter a valid 10-digit mobile number.";

        if (form.email && !/\S+@\S+\.\S+/.test(form.email))
        newErrors.email = "Enter a valid email address.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
        const response = await api.post("/seekers", form);
        Alert.alert("Success", "Seeker added successfully!");
        setTimeout(() => {
            router.replace("/seekers");
        }, 1000);
        } catch (error) {
        console.log(error.response?.data || error.message);
        Alert.alert("Error", "Failed to add seeker. Check inputs or connection.");
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={80}
        >
            <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>Add New Seeker</Text>

                {/* First Name */}
                <TextInput
                    style={[styles.input, errors.first_name && styles.inputError]}
                    placeholder="First Name"
                    value={form.first_name}
                    onChangeText={(text) => handleChange("first_name", text)}
                />
                {errors.first_name ? <Text style={styles.errorText}>{errors.first_name}</Text> : null}

                {/* Last Name */}
                <TextInput
                    style={styles.input}
                    placeholder="Last Name"
                    value={form.last_name}
                    onChangeText={(text) => handleChange("last_name", text)}
                />

                {/* Email */}
                <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Email"
                    value={form.email}
                    onChangeText={(text) => handleChange("email", text)}
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

                {/* Mobile */}
                <TextInput
                    style={[styles.input, errors.mobile && styles.inputError]}
                    placeholder="Mobile"
                    keyboardType="phone-pad"
                    value={form.mobile}
                    onChangeText={(text) => handleChange("mobile", text)}
                />
                {errors.mobile ? <Text style={styles.errorText}>{errors.mobile}</Text> : null}

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
                
                {/* Type (Dropdown) */}
                <View style={styles.dropdownContainer}>
                    <Text style={styles.dropdownLabel}>Seeker Type</Text>
                    <View style={styles.dropdownBox}>
                        <Picker
                        selectedValue={form.type}
                        onValueChange={(itemValue) => handleChange("type", itemValue)}
                        style={styles.picker}
                        dropdownIconColor="#2196F3"
                        >
                        <Picker.Item label="Pratishthan" value="1" />
                        <Picker.Item label="Public Program" value="2" />
                        </Picker>
                    </View>
                </View>


                <TextInput
                    style={styles.input}
                    placeholder="Occupation"
                    value={form.occupation}
                    onChangeText={(text) => handleChange("occupation", text)}
                />

                <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Interested in Follow-up</Text>
                    <View style={styles.switchWithSides}>
                    <Text style={[styles.sideText, !form.followup && styles.activeOff]}>No</Text>
                    <Switch
                        value={form.followup}
                        onValueChange={(val) => handleChange("followup", val)}
                        thumbColor={form.followup ? "#2196F3" : "#f4f3f4"}
                        trackColor={{ false: "#ccc", true: "#81b0ff" }}
                    />
                    <Text style={[styles.sideText, form.followup && styles.activeOn]}>YES</Text>
                    </View>
                </View>

                <Button title="Save Seeker" onPress={handleSubmit} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
    }

    const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#fff" },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
    },
    inputError: {
        borderColor: "#f44336",
    },
    errorText: {
        color: "#f44336",
        fontSize: 13,
        marginTop: -5,
        marginBottom: 10,
    },
    switchContainer: {
        marginBottom: 20,
    },
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
    
  dropdownContainer: {
    marginBottom: 15,
  },
  dropdownLabel: {
        fontSize: 16,
        fontWeight: "500",
        color: "#333",
        marginBottom: 6,
    },
    dropdownBox: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        overflow: "hidden", // ensures clean edges
        backgroundColor: "#fff",
    },
    picker: {
        height: 50, // <-- increase height for full text visibility
        width: "100%",
        color: "#333",
    },
});
