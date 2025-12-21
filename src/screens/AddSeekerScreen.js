import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter, useNavigation } from "expo-router"; 
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/api/apiClient";
import { AuthContext } from "../../src/context/AuthContext";

// --- Constants ---
const PRIMARY_COLOR = "#007AFF"; 
const BORDER_COLOR = "#E0E0E0"; 
const BACKGROUND_COLOR = "#FFFFFF"; 
const PADDING_BOTTOM = 120; 
const OTHER_AREA_VALUE = "0"; // Special ID for "Other" option
const SUBTLE_COLOR = "#9E9E9E"; 
const ERROR_COLOR = "#F44336";

// Define the roles that must be restricted to 'Public' (value 2)
const RESTRICTED_ROLES = [3, 5, 6]; 
const FIXED_TYPE_VALUE = "2";

// --- FieldWrapper Component ---
const FieldWrapper = ({ children, iconName, disabled = false }) => (
    <View style={[styles.fieldWrapper, disabled && styles.fieldDisabled]}>
        <Ionicons name={iconName} size={20} color={disabled ? SUBTLE_COLOR : PRIMARY_COLOR} style={styles.inputIcon} />
        {children}
    </View>
);
// --- End FieldWrapper ---

export default function AddSeekerScreen() {
  const { user } = useContext(AuthContext);
  
  // Check if the current user's role is restricted (used for initial state and logic)
  const isRoleRestricted = RESTRICTED_ROLES.includes(parseInt(user?.role_id));
  
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
    
    // Initialized 'type' state: sets to "2" for restricted roles, "" otherwise
    type: isRoleRestricted ? FIXED_TYPE_VALUE : "", 
  });

  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [isSaving, setIsSaving] = useState(false); 
  const router = useRouter();
  const navigation = useNavigation(); 

  // Determine the type value used in the Picker's selectedValue
  const typeValue = isRoleRestricted ? FIXED_TYPE_VALUE : form.type;

  const ageRanges = [
      { label: "Select Age Range", value: "" },
      { label: "5 - 15 years", value: "5-15" },
      { label: "15 - 30 years", value: "15-30" },
      { label: "30 - 50 years", value: "30-50" },
      { label: "50+ years", value: "50+" },
  ];
  
  // --- CORE HANDLERS ---

  const handleAreaChange = (areaId) => {
    let newZoneId = "";
    
    if (areaId && areaId !== OTHER_AREA_VALUE) {
      const selectedArea = areas.find(area => String(area.id) === areaId);
      if (selectedArea) {
        newZoneId = String(selectedArea.zone_id);
      }
    }

    setForm(prevForm => ({ 
        ...prevForm, 
        area_id: areaId, 
        zone_id: newZoneId,
        custom_area_name: (areaId !== OTHER_AREA_VALUE) ? "" : prevForm.custom_area_name 
    }));
  };
  
  // MODIFIED handleChange with Guard Clause
  const handleChange = (key, value) => {
      // GUARD CLAUSE: Prevent type change for restricted roles
      if (key === 'type' && isRoleRestricted) {
          return; 
      }
      
      // Ensure 'type' value is always a string for the Picker comparison
      if (key === 'type' && value !== "") {
          value = String(value);
      }

      setForm(prevForm => ({ 
          ...prevForm, 
          [key]: value 
      }));
  };

  const handleSubmit = useCallback(async () => {
    if (isSaving) return;
    
    const mobileNumber = form.mobile.trim();
    
    // 1. Core Validation (Ensures the required fields are non-empty)
    if (!form.first_name.trim() || !mobileNumber || !form.sex || !typeValue) {
        Alert.alert("Missing Fields", "Please fill in First Name, Mobile, Gender, and Seeker Type.");
        return;
    }

    // 2. Mobile Validation
    if (mobileNumber.length !== 10 || !/^\d+$/.test(mobileNumber)) {
        Alert.alert("Invalid Mobile Number", "Mobile number must be exactly 10 digits.");
        return;
    }

    // 3. Custom Area validation
    if (form.area_id === OTHER_AREA_VALUE && !form.custom_area_name.trim()) {
        Alert.alert("Missing Area", "Please enter the name of the new area.");
        return;
    }
    
    setIsSaving(true);
    try {
      // 4. Prepare dataToSend
      const dataToSend = {
        ...form,

        mobile: mobileNumber, 
        
        // Use the final determined typeValue, convert to Number for API
        type: Number(typeValue), 
        
        comment: form.area_id === OTHER_AREA_VALUE 
            ? `New Area: ${form.custom_area_name.trim()}` 
            : null,
            
        zone_id: form.zone_id ? String(form.zone_id) : null,
        area_id: (form.area_id && form.area_id !== OTHER_AREA_VALUE) 
            ? String(form.area_id) 
            : null,
      };

      // Clean up client-side fields
      delete dataToSend.custom_area_name;
      delete dataToSend.age; 

      await api.post("/seekers", dataToSend);
      Alert.alert("Success", "Seeker added successfully!");
      router.replace("/seekers"); 

    } catch (error) {
      console.log("Error adding seeker:", error.response?.data || error.message);
  
      const errorMessage = 
          error.response?.data?.message || 
          error.response?.data?.error || 
          error.message || 
          "Something went wrong";
  
      Alert.alert("Error", errorMessage);
  }finally {
      setIsSaving(false);
    }
  }, [form, isSaving, router, typeValue]);
  
  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
        try {
            const [zonesRes, areasRes] = await Promise.all([
                api.get("/zones"),
                api.get("/areas")
            ]);
            
            setZones(zonesRes.data.map(zone => ({ ...zone, id: String(zone.id) })));
            setAreas(areasRes.data.map(area => ({ 
                ...area, 
                id: String(area.id),
                zone_id: String(area.zone_id) 
            })));

        } catch (error) {
            console.log("Error fetching data (Zones/Areas):", error.message);
        }
    };
    fetchData();
  }, []);
  
  // --- Header Setup ---
  useEffect(() => {
    navigation.setOptions({
      title: "Add New Seeker",
      headerRight: () => (
        <TouchableOpacity 
          onPress={handleSubmit} 
          disabled={isSaving}
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
  }, [handleSubmit, isSaving, navigation]);

  
  // --- Seeker Type Options Generator (The fix for "undefined") ---
  const seekerTypeOptions = isRoleRestricted
    ? [
        { label: "Public", value: FIXED_TYPE_VALUE } 
      ]
    : [
        { label: "Select Type", value: "" }, 
        { label: "Pratishthan", value: "1" },
        { label: "Public", value: "2" }
      ];


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
        
        <Text style={styles.sectionTitle}>Seeker Information</Text>

        {/* --- First Name --- */}
        <FieldWrapper iconName="person-outline">
            <TextInput
                style={styles.textInput}
                placeholder="First Name *"
                value={form.first_name}
                onChangeText={(text) => handleChange("first_name", text)}
            />
        </FieldWrapper>

        {/* --- Last Name --- */}
        <FieldWrapper iconName="person-circle-outline">
            <TextInput
                style={styles.textInput}
                placeholder="Last Name"
                value={form.last_name}
                onChangeText={(text) => handleChange("last_name", text)}
            />
        </FieldWrapper>

        {/* --- Mobile --- */}
        <FieldWrapper iconName="call-outline">
            <TextInput
                style={styles.textInput}
                placeholder="Mobile *"
                keyboardType="phone-pad"
                maxLength={10}
                value={form.mobile}
                onChangeText={(text) => handleChange("mobile", text)}
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

        {/* --- Gender Dropdown --- */}
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

        {/* --- Area Dropdown --- */}
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
                <Picker.Item label="Other (Enter below)" value={OTHER_AREA_VALUE} /> 
            </Picker>
        </FieldWrapper>
        
        {/* 🎯 CONDITIONAL INPUT: Custom Area Name */}
        {form.area_id === OTHER_AREA_VALUE && (
            <FieldWrapper iconName="pencil-outline">
                <TextInput
                    style={styles.textInput}
                    placeholder="Enter New Area Name *"
                    value={form.custom_area_name}
                    onChangeText={(text) => handleChange("custom_area_name", text)}
                />
            </FieldWrapper>
        )}

        {/* --- ZONE Dropdown (Automatic selection, disabled) --- */}
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
                        : "Zone N/A (Select Area)"
                    } 
                    value={form.zone_id} 
                />
            </Picker>
        </FieldWrapper>

        {/* 🧘‍♂️ Type (Role Restricted) */}
        <Text style={styles.label}>Seeker Type *</Text>
        <FieldWrapper iconName="people-outline" disabled={isRoleRestricted}>
            <Picker
                selectedValue={typeValue}
                onValueChange={(value) => handleChange("type", value)}
                enabled={!isRoleRestricted} 
                
                style={[
                    styles.picker, 
                    isRoleRestricted && styles.pickerDisabled 
                ]}
            >
                {/* Dynamically generated options array */}
                {seekerTypeOptions.map((item) => (
                    <Picker.Item 
                        key={item.value || 'select-default'} 
                        label={item.label} 
                        value={item.value} 
                    />
                ))}
            </Picker>
        </FieldWrapper>

        {isRoleRestricted && (
            <Text style={styles.restrictionText}>
                * Type is fixed to "Public" for your role.
            </Text>
        )}

        <Text style={styles.requiredText}>* Indicates Required Field</Text>
        
        </ScrollView>
    </KeyboardAvoidingView>
    );
}


const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: BACKGROUND_COLOR,
        paddingBottom: PADDING_BOTTOM, 
      },
      sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: PRIMARY_COLOR,
        marginBottom: 15,
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
        color: ERROR_COLOR,
        marginTop: 10,
        textAlign: 'right',
        paddingRight: 5,
      },
      headerSaveButton: {
        paddingHorizontal: 5,
        marginRight: Platform.OS === 'ios' ? -5 : 0,
      },
      headerSaveText: {
        color: PRIMARY_COLOR,
        fontSize: 17,
        fontWeight: '600',
      },
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
        backgroundColor: 'transparent',
      },
      restrictionText: {
        color: ERROR_COLOR,
        fontSize: 12,
        marginBottom: 10,
        marginLeft: 5,
    },
});