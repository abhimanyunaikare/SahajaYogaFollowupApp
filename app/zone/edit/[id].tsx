import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator, // Added for loading state
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../src/api/apiClient";

// --- Constants (Matching previous Zone styles) ---
const PRIMARY_COLOR = "#00A86B"; // Green for Zone module
const DELETE_COLOR = "#F44336";
const TEXT_COLOR = "#212121";
const SUBTLE_TEXT_COLOR = "#757575";
const BACKGROUND_COLOR = "#F4F4F4"; 
const ITEM_BACKGROUND = "#FFFFFF"; 

// Renamed to follow component purpose
export default function EditZoneScreen() { 
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [form, setForm] = useState({ name: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // --- FETCH ZONE DATA ---
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        // Uses Route::get('/zones/{id}', [ZoneController::class, 'show']);
        const zoneRes = await api.get(`/zones/${id}`);
        const zone = zoneRes.data;

        setForm({
          name: zone.name || ""
        });
      } catch (error) {
        console.log("Error fetching zone:", error.message);
        Alert.alert("Error", "Failed to fetch zone details.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  
  // --- UPDATE HANDLER ---
  const handleUpdate = async () => {
    if (!form.name.trim()) {
        Alert.alert("Validation", "Zone name cannot be empty.");
        return;
    }

    setSubmitting(true);
    try {
      // Uses Route::put('/zones/{id}', [ZoneController::class, 'update']);
      await api.put(`/zones/${id}`, form);
      
      Alert.alert("Success", "Zone updated successfully!"); 
      router.replace("/zone"); // Navigate back to the Zone list
    } catch (error) {
      console.log("Error updating zone:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Failed to update zone.");
    } finally {
        setSubmitting(false);
    }
  };

  // --- DELETE HANDLER (NEW) ---
  const handleDelete = () => {
      Alert.alert(
          "Confirm Delete",
          `Are you sure you want to delete the zone: ${form.name}? This action cannot be undone.`,
          [
              { text: "Cancel", style: "cancel" },
              { 
                  text: "Delete", 
                  style: "destructive", 
                  onPress: async () => {
                      setSubmitting(true);
                      try {
                          // Uses Route::delete('/zones/{id}', [ZoneController::class, 'destroy']);
                          await api.delete(`/zones/${id}`);
                          Alert.alert("Success", "Zone deleted successfully.");
                          router.replace('/zone');
                      } catch (error) {
                          Alert.alert("Error", "Failed to delete zone.");
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

  return (
    <>
        <Stack.Screen options={{ title: `Edit: ${form.name}` }} />
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.formContainer}>

                <Text style={styles.label}>Zone Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Zone Name"
                    value={form.name}
                    onChangeText={(text) => setForm({ ...form, name: text })}
                    editable={!submitting}
                />
            
                {/* Save Changes Button */}
                <TouchableOpacity 
                    style={[styles.button, styles.submitButton]} 
                    onPress={handleUpdate} 
                    disabled={submitting}
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
                    <Text style={styles.deleteButtonText}>Delete Zone</Text>
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