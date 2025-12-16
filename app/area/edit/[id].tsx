import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator, 
} from "react-native";
import { Picker } from '@react-native-picker/picker'; // Required dependency
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../src/api/apiClient";

// --- Constants (Adjusted for Area/Zone context) ---
const PRIMARY_COLOR = "#007AFF"; // Using a consistent primary color
const DELETE_COLOR = "#F44336";
const TEXT_COLOR = "#212121";
const SUBTLE_TEXT_COLOR = "#757575";
const BACKGROUND_COLOR = "#F4F4F4"; 
const ITEM_BACKGROUND = "#FFFFFF"; 

// File should be located at: app/areas/[id].js
export default function EditAreaScreen() { 
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // 🛑 State now holds name and zone_id
  const [form, setForm] = useState({ name: "", zone_id: null }); 
  const [zones, setZones] = useState([]); // State for the Zone dropdown
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // --- FETCH AREA DATA AND ALL ZONES ---
  const fetchData = useCallback(async () => {
    if (!id) {
        setLoading(false);
        return;
    }

    try {
      // 1. Fetch Area details
      const areaRes = await api.get(`/areas/${id}`); // 🛑 API call changed to /areas
      const area = areaRes.data;

      // 2. Fetch all Zones
      const zonesRes = await api.get("/zones");

      setZones(zonesRes.data);
      
      // Set the form state with the area's current data
      setForm({
        name: area.name || "",
        zone_id: area.zone_id, // 🛑 Set the current zone_id
      });

    } catch (error) {
      console.error("Error fetching data:", error.message);
      Alert.alert("Error", "Failed to fetch area or zone details.");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  
  // --- UPDATE HANDLER ---
  const handleUpdate = async () => {
    if (!form.name.trim() || !form.zone_id) {
        Alert.alert("Validation", "Area name and Zone selection are required.");
        return;
    }

    setSubmitting(true);
    try {
      // 🛑 API call changed to /areas
      await api.put(`/areas/${id}`, form);
      
      Alert.alert("Success", "Area updated successfully!"); 
      // 🛑 Navigation path corrected to /areas/list
      router.replace("/area"); 
    } catch (error) {
      console.error("Error updating area:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Failed to update area.");
    } finally {
        setSubmitting(false);
    }
  };

  // --- DELETE HANDLER ---
  const handleDelete = () => {
      Alert.alert(
          "Confirm Delete",
          `Are you sure you want to delete the area: ${form.name}? This action cannot be undone.`,
          [
              { text: "Cancel", style: "cancel" },
              { 
                  text: "Delete", 
                  style: "destructive", 
                  onPress: async () => {
                      setSubmitting(true);
                      try {
                          // 🛑 API call changed to /areas
                          await api.delete(`/areas/${id}`);
                          Alert.alert("Success", "Area deleted successfully.");
                          // 🛑 Navigation path corrected to /areas/list
                          router.replace('/area');
                      } catch (error) {
                          Alert.alert("Error", "Failed to delete area.");
                      } finally {
                          setSubmitting(false);
                      }
                  } 
              },
          ]
      );
  };


  if (loading) {
    return (
        <View style={styles.loader}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
    );
  }

  // Ensure we have zones to display
  const hasZones = zones.length > 0;

  return (
    <>
        <Stack.Screen options={{ title: `Edit: ${form.name}` }} />
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.formContainer}>
                <Text style={styles.title}>Edit Area Details</Text>

                {/* --- Zone Dropdown --- */}
                <Text style={styles.label}>Assigned Zone</Text>
                <View style={styles.pickerContainer}>
                    {hasZones ? (
                        <Picker
                            selectedValue={form.zone_id}
                            onValueChange={(itemValue) => setForm(f => ({ ...f, zone_id: itemValue }))}
                            style={styles.picker}
                            enabled={!submitting}
                        >
                            {zones.map((zone) => (
                                <Picker.Item 
                                    key={zone.id} 
                                    label={zone.name} 
                                    value={zone.id} 
                                />
                            ))}
                        </Picker>
                    ) : (
                        <Text style={styles.noDataText}>No zones available.</Text>
                    )}
                </View>

                {/* --- Area Name Input --- */}
                <Text style={styles.label}>Area Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Area Name"
                    value={form.name}
                    onChangeText={(text) => setForm(f => ({ ...f, name: text }))}
                    editable={!submitting}
                />
            
                {/* Save Changes Button */}
                <TouchableOpacity 
                    style={[styles.button, styles.submitButton]} 
                    onPress={handleUpdate} 
                    disabled={submitting || !hasZones}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.buttonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity 
                    style={[styles.button, styles.deleteButton]} 
                    onPress={handleDelete}
                    disabled={submitting}
                >
                    <Text style={styles.deleteButtonText}>Delete Area</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
    container: { 
        padding: 15, 
        backgroundColor: BACKGROUND_COLOR, 
        flexGrow: 1 
    },
    loader: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: BACKGROUND_COLOR 
    },
    title: { 
        fontSize: 22, 
        fontWeight: "700", 
        marginBottom: 20, 
        color: TEXT_COLOR 
    },
    formContainer: { 
        backgroundColor: ITEM_BACKGROUND, 
        padding: 20, 
        borderRadius: 10, 
        elevation: 2 
    },
    
    label: { 
        fontSize: 16, 
        fontWeight: '600', 
        color: TEXT_COLOR, 
        marginBottom: 5 
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        fontSize: 16,
        color: TEXT_COLOR,
    },
    
    // --- Picker Styles ---
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        marginBottom: 20,
        overflow: 'hidden',
        justifyContent: 'center',
        height: 50,
    },
    picker: {
        height: 50,
        width: '100%',
    },
    noDataText: {
        paddingLeft: 10,
        color: SUBTLE_TEXT_COLOR,
        fontSize: 16,
    },

    // --- Button Styles ---
    button: {
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    submitButton: {
        backgroundColor: PRIMARY_COLOR,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    deleteButton: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: DELETE_COLOR,
    },
    deleteButtonText: {
        color: DELETE_COLOR,
        fontSize: 16,
        fontWeight: '700',
    }
});