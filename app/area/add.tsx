import React, { useEffect, useState } from "react";
import { 
    View, 
    TextInput, 
    Text, 
    StyleSheet, 
    Alert, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator,
    Platform 
} from "react-native";
import { Picker } from '@react-native-picker/picker'; // 💡 Required dependency
import { useRouter, Stack } from "expo-router";
import api from "../../src/api/apiClient";
import { Ionicons } from "@expo/vector-icons";

// --- Constants (Matching previous Zone/Area styles) ---
const PRIMARY_COLOR = "#007AFF"; // Use the general primary color
const TEXT_COLOR = "#212121";
const SUBTLE_TEXT_COLOR = "#757575";
const BACKGROUND_COLOR = "#F4F4F4"; 
const ITEM_BACKGROUND = "#FFFFFF"; 

export default function AddAreaScreen() {
  const router = useRouter();
  
  const [form, setForm] = useState({ name: "", zone_id: null }); // Include zone_id
  const [zones, setZones] = useState([]); // State to hold the list of zones
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // --- 1. Fetch Zones for Dropdown ---
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await api.get("/zones"); // Assuming this endpoint returns all zones
        setZones(response.data);
        
        // Auto-select the first zone if available
        if (response.data.length > 0) {
            setForm(f => ({ ...f, zone_id: response.data[0].id }));
        }
      } catch (error) {
        console.log("Error adding seeker:", error.response?.data || error.message);
    
        const errorMessage = 
            error.response?.data?.message || 
            error.response?.data?.error || 
            error.message || 
            "Something went wrong";
    
        Alert.alert("Error", errorMessage);
    }finally {
        setLoading(false);
      }
    };
    fetchZones();
  }, []);

  // --- 2. Handle Form Submission ---
  const handleSubmit = async () => {
    if (!form.name.trim() || !form.zone_id) {
        Alert.alert("Validation Error", "Please enter the Area Name and select a Zone.");
        return;
    }
    
    setSubmitting(true);
    try {
      // Uses Route::post('/areas', [AreaController::class, 'store']);
      await api.post("/areas", form);
      
      Alert.alert("Success", "Area added successfully!");
      router.replace("/area"); // Navigate back to the Area list
    } catch (error) {
      console.error("Error adding area:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Failed to add area.");
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) {
    return (
        <View style={styles.loader}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
    );
  }
  
  // Prepare zone data for Picker
  const zoneItems = zones.map(zone => ({
      label: zone.name,
      value: zone.id
  }));


  return (
    <>
        <Stack.Screen options={{ title: "Add New Area" }} />
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.formContainer}>
                
                <Text style={styles.label}>Zone</Text>
                {/* 3. Zone Selection Dropdown */}
                <View style={styles.pickerContainer}>
                    {zoneItems.length > 0 ? (
                        <Picker
                            selectedValue={form.zone_id}
                            onValueChange={(itemValue) => setForm({ ...form, zone_id: itemValue })}
                            style={styles.picker}
                            enabled={!submitting}
                        >
                            {zoneItems.map((item) => (
                                <Picker.Item 
                                    key={item.value} 
                                    label={item.label} 
                                    value={item.value} 
                                />
                            ))}
                        </Picker>
                    ) : (
                        <Text style={styles.noDataText}>No zones available. Please add a zone first.</Text>
                    )}
                </View>

                <Text style={styles.label}>Area Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Area Name"
                    value={form.name}
                    onChangeText={(text) => setForm({ ...form, name: text })}
                    editable={!submitting}
                />

                {/* Submit Button */}
                <TouchableOpacity 
                    style={styles.submitButton} 
                    onPress={handleSubmit} 
                    disabled={submitting || zoneItems.length === 0}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.buttonText}>Save Area</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: BACKGROUND_COLOR, flexGrow: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND_COLOR },
  formContainer: { backgroundColor: ITEM_BACKGROUND, padding: 20, borderRadius: 10, elevation: 2 },
  
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20, textAlign: "center", color: TEXT_COLOR },
  
  label: { fontSize: 16, fontWeight: '600', color: TEXT_COLOR, marginBottom: 5, marginTop: 10 },
  
  // --- Input and Picker Styles ---
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    color: TEXT_COLOR,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    height: 50, // Standard height for input
  },
  picker: {
    // Styling for Android/iOS native picker needs to be handled via itemStyle/dropdownIconStyle if using react-native-picker-select
    height: 50,
    width: '100%',
  },
  noDataText: {
    paddingLeft: 10,
    color: SUBTLE_TEXT_COLOR,
    fontSize: 16,
  },

  // --- Button Styles ---
  submitButton: {
    backgroundColor: PRIMARY_COLOR,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});