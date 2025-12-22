import React, { useState, useEffect, useCallback, useLayoutEffect } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Switch,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
// Ensure you are importing useLocalSearchParams for the Edit Screen
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router"; 
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/api/apiClient"; // Adjusted path based on user's file structure

// --- Constants ---
const PRIMARY_COLOR = "#007AFF"; 
const BORDER_COLOR = "#E0E0E0"; 
const BACKGROUND_COLOR = "#FFFFFF"; 
const PADDING_BOTTOM = 120; 
const OTHER_AREA_VALUE = "0"; // Special ID for "Other" option
const SUBTLE_COLOR = "#9E9E9E"; 

// Helper component for unified input/picker view (Defined outside for stability)
const FieldWrapper = ({ children, iconName, disabled = false }) => (
    <View style={[styles.fieldWrapper, disabled && styles.fieldDisabled]}>
        <Ionicons name={iconName} size={20} color={disabled ? SUBTLE_COLOR : PRIMARY_COLOR} style={styles.inputIcon} />
        {children}
    </View>
);

export default function EditSeekerScreen() {
  const { id } = useLocalSearchParams(); // Get seeker ID from URL params
  const router = useRouter();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]); 

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    mobile: "",
    age_range: "",
    age: "",
    sex: "",
    zone_id: "",
    area_id: "",
    custom_area_name: "",
    type: "",
    occupation: "",
    interested_in_followup: false,
    called: false,
    move_to_zonal_monitoring: false,
    comment: "",
  });

  const ageRanges = [
      { label: "Select Age Range", value: "" },
      { label: "5 - 15 years", value: "5-15" },
      { label: "15 - 30 years", value: "15-30" },
      { label: "30 - 50 years", value: "30-50" },
      { label: "50+ years", value: "50+" },
  ];

  const handleChange = (key, value) => setForm({ ...form, [key]: value });

  // --- Core Logic Update: Corrected handleAreaChange ---
  const handleAreaChange = (areaId) => {
    let newZoneId = "";
    
    if (areaId && areaId !== OTHER_AREA_VALUE) {
      // Find the corresponding area object
      const selectedArea = areas.find(area => String(area.id) === areaId);
      if (selectedArea) {
        // Automatically set the zone_id from the selected area's zone_id
        newZoneId = String(selectedArea.zone_id);
      }
    } else if (areaId === OTHER_AREA_VALUE) {
        // Reset zone if "Other" is selected
        newZoneId = "";
    }

    setForm(prevForm => ({ 
        ...prevForm, 
        area_id: areaId, 
        zone_id: newZoneId,
        // FIX: Preserve custom_area_name if the user selects 'Other'
        custom_area_name: areaId === OTHER_AREA_VALUE 
            ? prevForm.custom_area_name 
            : "", // Clear if a real area is selected
    }));
  };


  const handleUpdate = useCallback(async () => {
    if (isSaving) return;

    // 1. Validation for Custom Area
    if (form.area_id === OTHER_AREA_VALUE && !form.custom_area_name) {
        Alert.alert("Missing Area", "Please enter the name of the new area.");
        return;
    }
    
    // 1. Validation for Mobile Number
    const mobileNumber = form.mobile.trim();
    if (mobileNumber.length !== 10 || !/^\d+$/.test(mobileNumber)) {
        Alert.alert("Invalid Mobile Number", "Mobile number must be exactly 10 digits.");
        return;
    }

    setIsSaving(true);
    try {
      // 2. Prepare dataToSend
      const dataToSend = {
        ...form,
        
        mobile: mobileNumber,
        
        // Map custom_area_name to the 'comment' field
        comment: form.area_id === OTHER_AREA_VALUE 
            ? `New Area: ${form.custom_area_name}` 
            : form.comment,
            
        // --- CRITICAL FIX: Ensure numerical IDs are sent for valid selections ---
        zone_id: form.zone_id ? Number(form.zone_id) : null,
        
        area_id: (form.area_id && form.area_id !== OTHER_AREA_VALUE) 
            ? Number(form.area_id) 
            : null, 
        // --- END CRITICAL FIX ---
            
        type: form.type ? Number(form.type) : 0,
        
        // Convert booleans to API-friendly format (e.g., 0/1 or just Booleans)
        interested_in_followup: Boolean(form.interested_in_followup),
        called: Boolean(form.called),
        move_to_zonal_monitoring: Boolean(form.move_to_zonal_monitoring),
      };

      // Remove redundant client-side fields before sending
      delete dataToSend.custom_area_name;
      delete dataToSend.age; 

      await api.put(`/seekers/${id}`, dataToSend);
      Alert.alert("Success", "Seeker updated successfully!");
      router.replace(`/seekers`); 

    } catch (error) {
      console.log("Error updating seeker:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to update seeker. Please check your data.");
    } finally {
      setIsSaving(false);
    }
  }, [id, form, isSaving, router]);
  
  // --- Header Setup ---
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Edit Seeker Details",
      headerRight: () => (
        <TouchableOpacity 
          onPress={handleUpdate} 
          disabled={isSaving || loading}
          style={styles.headerSaveButton}
        >
          {isSaving ? (
            <ActivityIndicator color={PRIMARY_COLOR} size="small" />
          ) : (
            <Text style={styles.headerSaveText}>Save</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [handleUpdate, isSaving, loading, navigation]);


  // --- Data Fetching and Initialization ---
  useEffect(() => {
    const fetchSeekerData = async () => {
      try {
        const [zonesRes, areasRes, seekerRes] = await Promise.all([
            api.get("/zones"),
            api.get("/areas"),
            api.get(`/seekers/${id}`),
        ]);
        
        const seeker = seekerRes.data;

        // 1. Set Zones and Areas (string IDs for state)
        setZones(zonesRes.data.map(zone => ({ ...zone, id: String(zone.id) })));
        setAreas(areasRes.data.map(area => ({ 
            ...area, 
            id: String(area.id),
            zone_id: String(area.zone_id) 
        })));

        // 2. Determine initial form state for Area/Zone
        let initialAreaId = seeker.area_id ? String(seeker.area_id) : "";
        let initialCustomAreaName = "";
        const commentText = seeker.comment || "";
        
        // Logic for handling existing 'Other' area from comment
        if (!seeker.area_id && commentText.startsWith("New Area:")) {
            initialAreaId = OTHER_AREA_VALUE; // Set to '0'
            initialCustomAreaName = commentText.replace("New Area: ", "").trim();
        }

        // 3. Set the full form state
        setForm(prevForm => ({
          ...prevForm,
          ...seeker,
          // Convert IDs to strings for Picker components
          zone_id: seeker.zone_id ? String(seeker.zone_id) : "",
          type: seeker.type ? String(seeker.type) : "",
          
          // Set determined Area/Custom Name values
          area_id: initialAreaId, 
          custom_area_name: initialCustomAreaName, 
          comment: commentText, 

          // Ensure booleans are correct
          interested_in_followup: Boolean(seeker.interested_in_followup),
          called: Boolean(seeker.called),
          move_to_zonal_monitoring: Boolean(seeker.move_to_zonal_monitoring),
        }));

      } catch (error) {
        console.log("Error fetching data:", error.response?.data || error.message);
        Alert.alert("Error", "Unable to load seeker details for editing.");
      } finally {
        setLoading(false);
      }
    };
    fetchSeekerData();
  }, [id]);


  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={{ marginTop: 10 }}>Loading seeker data...</Text>
      </View>
    );
  }

  // --- JSX Rendering ---
  return (
    <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20} 
    >
        <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false} 
        >      
        
        <Text style={styles.sectionTitle}>Seeker Details</Text>

        {/* --- Text Inputs --- */}
        <Text style={styles.label}>First Name *</Text>
        <FieldWrapper iconName="person-outline">
            <TextInput
                style={styles.textInput}
                placeholder="First Name"
                value={form.first_name}
                onChangeText={(text) => handleChange("first_name", text)}
            />
        </FieldWrapper>

        <Text style={styles.label}>Last Name (Optional)</Text>
        <FieldWrapper iconName="person-circle-outline">
            <TextInput
                style={styles.textInput}
                placeholder="Last Name"
                value={form.last_name}
                onChangeText={(text) => handleChange("last_name", text)}
            />
        </FieldWrapper>

        <Text style={styles.label}>Mobile *</Text>
        <FieldWrapper iconName="call-outline">
            <TextInput
                style={styles.textInput}
                placeholder="Mobile"
                keyboardType="phone-pad"
                value={form.mobile}
                editable={false}
                selectTextOnFocus={false}
            />
        </FieldWrapper>

        <Text style={styles.label}>Occupation</Text>
        <FieldWrapper iconName="briefcase-outline">
            <TextInput
                style={styles.textInput}
                placeholder="Occupation"
                value={form.occupation}
                onChangeText={(text) => handleChange("occupation", text)}
            />
        </FieldWrapper>
        
        {/* --- Age Range Dropdown --- */}
        <Text style={styles.label}>Age Range</Text>
        <FieldWrapper iconName="calendar-outline">
            <Picker
                selectedValue={form.age_range}
                onValueChange={(itemValue) => handleChange("age_range", itemValue)}
                style={styles.picker}
            >
                {ageRanges.map((range) => (
                    <Picker.Item 
                        key={range.value || 'default'} 
                        label={range.label} 
                        value={range.value} 
                    />
                ))}
            </Picker>
        </FieldWrapper>

        {/* --- sex Dropdown --- */}
        <Text style={styles.label}>Gender *</Text>
        <FieldWrapper iconName="accessibility-outline">
            <Picker
                selectedValue={form.sex}
                onValueChange={(value) => handleChange("sex", value)}
                style={styles.picker}
            >
                <Picker.Item label="Select Gender" value="" />
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
                <Picker.Item label="Other" value="Other" />
            </Picker>
        </FieldWrapper>
{/* 
        <Text style={styles.label}>Address</Text>
        <FieldWrapper iconName="home-outline">
            <TextInput
                style={styles.textInput}
                placeholder="Address"
                value={form.address}
                onChangeText={(text) => handleChange("address", text)}
            />
        </FieldWrapper> */}

        {/* 🌍 Area Dropdown */}
        <Text style={styles.label}>Area</Text>
        <FieldWrapper iconName="location-outline">
            <Picker
                selectedValue={form.area_id}
                onValueChange={handleAreaChange} 
                style={styles.picker}
            >
                <Picker.Item label="Select Area" value="" />
                {areas.map((area) => (
                    <Picker.Item key={area.id} label={area.name} value={area.id} />
                ))}
                {/* Custom 'Other' option */}
                <Picker.Item label="Other (Enter below)" value={OTHER_AREA_VALUE} /> 
            </Picker>
        </FieldWrapper>
        
        {/* 🎯 CONDITIONAL INPUT: Custom Area Name */}
        {form.area_id === OTHER_AREA_VALUE && (
            <>
                <Text style={styles.label}>New Area Name *</Text>
                <FieldWrapper iconName="pencil-outline">
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter New Area Name *"
                        value={form.custom_area_name}
                        onChangeText={(text) => handleChange("custom_area_name", text)}
                    />
                </FieldWrapper>
            </>
        )}

        {/* 🌍 ZONE Dropdown (Automatic selection, disabled) */}
        <Text style={styles.label}>Zone (Auto-selected by Area)</Text>
        <FieldWrapper iconName="compass-outline" disabled={true}>
            <Picker
                selectedValue={form.zone_id}
                onValueChange={() => {}} 
                style={[styles.picker, styles.pickerDisabled]}
                enabled={false} 
            >
                <Picker.Item 
                    label={form.zone_id 
                        ? zones.find(z => z.id === form.zone_id)?.name 
                        : "Not Applied"
                    } 
                    value={form.zone_id} 
                    {...(!form.zone_id && { label: "Not Applied", value: "" })}
                />
            </Picker>
        </FieldWrapper>

        {/* 🧘‍♂️ Type */}
        <Text style={styles.label}>Seeker Type *</Text>
        <FieldWrapper iconName="people-outline">
            <Picker
                selectedValue={form.type}
                onValueChange={(value) => handleChange("type", value)}
                style={styles.picker}
            >
                <Picker.Item label="Select Type" value="" />
                <Picker.Item label="Pratishthan" value="1" />
                <Picker.Item label="Public" value="2" />
            </Picker>
        </FieldWrapper>

        {/* --- Switch Fields --- */}
        <Text style={[styles.sectionTitle, { marginTop: 25 }]}>Status & Follow-up</Text>
        <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Seeker Called (Initial Contact)</Text>
            
            <View style={styles.switchWrapper}>
                {/* "No" on the left */}
                <Text style={[
                    styles.yesNoText, 
                    { color: !form.called ? "#F44336" : SUBTLE_COLOR, fontWeight: !form.called ? "700" : "400" }
                ]}>
                    No
                </Text>

                <Switch
                    value={form.called}
                    onValueChange={(val) => handleChange("called", val)}
                    thumbColor={form.called ? PRIMARY_COLOR : "#F5F5F5"}
                    trackColor={{ false: "#D1D1D6", true: "#A0C8F9" }}
                />

                {/* "Yes" on the right */}
                <Text style={[
                    styles.yesNoText, 
                    { marginLeft: 8, marginRight: 0, color: form.called ? PRIMARY_COLOR : SUBTLE_COLOR, fontWeight: form.called ? "700" : "400" }
                ]}>
                    Yes
                </Text>
            </View>
        </View>

        <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Interested in Sahajayoga followup</Text>
            
            <View style={styles.switchWrapper}>
                <Text style={[
                    styles.yesNoText, 
                    { color: !form.interested_in_followup ? "#F44336" : SUBTLE_COLOR, fontWeight: !form.interested_in_followup ? "700" : "400" }
                ]}>
                    No
                </Text>

                <Switch
                    value={form.interested_in_followup}
                    onValueChange={(val) => handleChange("interested_in_followup", val)}
                    thumbColor={form.interested_in_followup ? PRIMARY_COLOR : "#F5F5F5"}
                    trackColor={{ false: "#D1D1D6", true: "#A0C8F9" }}
                />

                <Text style={[
                    styles.yesNoText, 
                    { marginLeft: 8, marginRight: 0, color: form.interested_in_followup ? PRIMARY_COLOR : SUBTLE_COLOR, fontWeight: form.interested_in_followup ? "700" : "400" }
                ]}>
                    Yes
                </Text>
            </View>
        </View>

        {/* --- Comment/Note --- */}
        <Text style={[styles.label, { marginTop: 20 }]}>Notes/Comments</Text>
        <FieldWrapper iconName="chatbox-outline">
            <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="Add a permanent note or comment here..."
                value={form.comment}
                onChangeText={(text) => handleChange("comment", text)}
                multiline={true}
                numberOfLines={4}
            />
        </FieldWrapper>
        
        <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Move to Zonal Coordinator</Text>
            
            <View style={styles.switchWrapper}>
                <Text style={[
                    styles.yesNoText, 
                    { color: !form.move_to_zonal_monitoring ? "#F44336" : SUBTLE_COLOR, fontWeight: !form.move_to_zonal_monitoring ? "700" : "400" }
                ]}>
                    No
                </Text>

                <Switch
                    value={form.move_to_zonal_monitoring}
                    onValueChange={(val) => handleChange("move_to_zonal_monitoring", val)}
                    thumbColor={form.move_to_zonal_monitoring ? PRIMARY_COLOR : "#F5F5F5"}
                    trackColor={{ false: "#D1D1D6", true: "#A0C8F9" }}
                />

                <Text style={[
                    styles.yesNoText, 
                    { marginLeft: 8, marginRight: 0, color: form.move_to_zonal_monitoring ? PRIMARY_COLOR : SUBTLE_COLOR, fontWeight: form.move_to_zonal_monitoring ? "700" : "400" }
                ]}>
                    Yes
                </Text>
            </View>
        </View>

        <Text style={styles.requiredText}>* Indicates Required Field</Text>
        
        </ScrollView>
    </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    loader: { 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center", 
        backgroundColor: BACKGROUND_COLOR 
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: BACKGROUND_COLOR,
        paddingBottom: PADDING_BOTTOM, 
      },
      sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: PRIMARY_COLOR,
        marginBottom: 5,
        marginTop: 5,
      },
      label: {
        marginBottom: 5,
        marginTop: 15, 
        fontWeight: "600",
        color: "#555",
        fontSize: 13,
      },
      requiredText: {
        fontSize: 12,
        color: '#F44336',
        marginTop: 10,
        textAlign: 'right',
        paddingRight: 5,
      },
      // --- Header Button Styles ---
      headerSaveButton: {
        paddingHorizontal: 5,
        marginRight: Platform.OS === 'ios' ? -5 : 0,
      },
      headerSaveText: {
        color: PRIMARY_COLOR,
        fontSize: 17,
        fontWeight: '600',
      },
      // --- Field Styling ---
      fieldWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        marginBottom: 10, 
        paddingHorizontal: 15,
        minHeight: 50,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 1,
            },
            android: {
                elevation: 0.5,
            },
        }),
      },
      fieldDisabled: {
          backgroundColor: '#F5F5F5', 
          borderColor: '#E0E0E0',
      },
      inputIcon: {
        marginRight: 15,
        opacity: 0.8,
      },
      textInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 16,
        color: '#333',
      },
      picker: {
        flex: 1,
        marginVertical: -5, 
        color: '#333',
      },
      pickerDisabled: {
        color: SUBTLE_COLOR, 
      },
      multilineInput: {
        height: Platform.OS === 'ios' ? 80 : undefined,
        minHeight: 80,
        textAlignVertical: 'top',
        paddingTop: 10,
        paddingBottom: 10,
      },
      // --- Switch Styles ---
      switchWrapper: {
          flexDirection: 'row',
          alignItems: 'center',
      },
      yesNoText: {
          marginRight: 8, 
          fontSize: 14,
          // Width removed so it wraps naturally
      },
      switchContainer: { 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        paddingHorizontal: 15, // Better horizontal spacing
        paddingVertical: 10,   // Slightly tighter vertical spacing
        marginBottom: 10,
      },
    
});