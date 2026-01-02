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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter, useNavigation } from "expo-router"; 
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/api/apiClient";
import { AuthContext } from "../../src/context/AuthContext";
import { Dropdown } from 'react-native-element-dropdown';

// --- Constants ---
const PRIMARY_COLOR = "#007AFF"; 
const BORDER_COLOR = "#E0E0E0"; 
const BACKGROUND_COLOR = "#FFFFFF"; 
const PADDING_BOTTOM = 120; 
const OTHER_AREA_VALUE = "0"; 
const SUBTLE_COLOR = "#9E9E9E"; 
const ERROR_COLOR = "#F44336";

const RESTRICTED_ROLES = [3, 5, 6]; 
const FIXED_TYPE_VALUE = "2";

// --- FieldWrapper Component ---
const FieldWrapper = ({ children, iconName, disabled = false }) => (
    <View style={[styles.fieldWrapper, disabled && styles.fieldDisabled]}>
        <Ionicons name={iconName} size={20} color={disabled ? SUBTLE_COLOR : PRIMARY_COLOR} style={styles.inputIcon} />
        {children}
    </View>
);

export default function AddSeekerScreen() {
  const { user } = useContext(AuthContext);
  const isRoleRestricted = RESTRICTED_ROLES.includes(parseInt(user?.role_id));
  
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    mobile: "",
    age_range: "", 
    sex: "",
    zone_id: "", 
    area_id: "", 
    custom_area_name: "", 
    type: isRoleRestricted ? FIXED_TYPE_VALUE : "", 
  });

  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [isSaving, setIsSaving] = useState(false); 
  const router = useRouter();
  const navigation = useNavigation(); 

  const typeValue = isRoleRestricted ? FIXED_TYPE_VALUE : form.type;

  const ageRanges = [
      { label: "Select Age Range", value: "" },
      { label: "5 - 15 years", value: "5-15" },
      { label: "15 - 30 years", value: "15-30" },
      { label: "30 - 50 years", value: "30-50" },
      { label: "50+ years", value: "50+" },
  ];
  
  // --- Handlers ---
  const handleAreaChange = (areaId) => {
    let newZoneId = "";
    if (areaId && areaId !== OTHER_AREA_VALUE) {
      const selectedArea = areas.find(area => String(area.id) === areaId);
      if (selectedArea) newZoneId = String(selectedArea.zone_id);
    }
    setForm(prevForm => ({ 
        ...prevForm, 
        area_id: areaId, 
        zone_id: newZoneId,
        custom_area_name: (areaId !== OTHER_AREA_VALUE) ? "" : prevForm.custom_area_name 
    }));
  };
  
  const handleChange = (key, value) => {
      if (key === 'type' && isRoleRestricted) return;
      setForm(prevForm => ({ ...prevForm, [key]: value }));
  };

  const handleSubmit = useCallback(async () => {
    if (isSaving) return;
    const mobileNumber = form.mobile.trim();
    
    if (!form.first_name.trim() || !mobileNumber || !form.sex || !typeValue) {
        Alert.alert("Missing Fields", "Please fill First Name, Mobile, Gender, and Type.");
        return;
    }

    if (mobileNumber.length !== 10) {
        Alert.alert("Invalid Mobile", "Mobile must be 10 digits.");
        return;
    }
    
    setIsSaving(true);
    try {
      const dataToSend = {
        ...form,
        mobile: mobileNumber, 
        type: Number(typeValue), 
        comment: form.area_id === OTHER_AREA_VALUE ? `New Area: ${form.custom_area_name.trim()}` : null,
      };

      await api.post("/seekers", dataToSend);
      Alert.alert("Success", "Seeker added successfully!");
      router.replace("/seekers"); 
    } catch (error) {
      Alert.alert("Error", "Failed to save seeker.");
    } finally {
      setIsSaving(false);
    }
  }, [form, isSaving, router, typeValue]);
  
  useEffect(() => {
    const fetchData = async () => {
        try {
            const [zonesRes, areasRes] = await Promise.all([api.get("/zones"), api.get("/areas")]);
            setZones(zonesRes.data.map(z => ({ ...z, id: String(z.id) })));
            setAreas(areasRes.data.map(a => ({ ...a, id: String(a.id), zone_id: String(a.zone_id) })));
        } catch (e) { console.log(e); }
    };
    fetchData();
  }, []);
  
  useEffect(() => {
    navigation.setOptions({
      title: "Add New Seeker",
      headerRight: () => (
        <TouchableOpacity onPress={handleSubmit} disabled={isSaving} style={{marginRight: 15}}>
          {isSaving ? <ActivityIndicator color={PRIMARY_COLOR} /> : <Text style={styles.headerSaveText}>Save</Text>}
        </TouchableOpacity>
      ),
    });
  }, [handleSubmit, isSaving, navigation]);

  return (
    <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20} 
    >
        <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false} 
        >      
        
        <Text style={styles.sectionTitle}>Seeker Information</Text>

        <FieldWrapper iconName="person-outline">
            <TextInput style={styles.textInput} placeholder="First Name *" value={form.first_name} onChangeText={(t) => handleChange("first_name", t)}/>
        </FieldWrapper>

        <FieldWrapper iconName="person-circle-outline">
            <TextInput style={styles.textInput} placeholder="Last Name" value={form.last_name} onChangeText={(t) => handleChange("last_name", t)}/>
        </FieldWrapper>

        <FieldWrapper iconName="call-outline">
            <TextInput style={styles.textInput} placeholder="Mobile *" keyboardType="phone-pad" maxLength={10} value={form.mobile} onChangeText={(t) => handleChange("mobile", t)}/>
        </FieldWrapper>
        
        <Text style={styles.label}>Age Range</Text>
        <FieldWrapper iconName="calendar-outline">
            <Picker selectedValue={form.age_range} onValueChange={(v) => handleChange("age_range", v)} style={styles.picker}>
                {ageRanges.map((r) => <Picker.Item key={r.value} label={r.label} value={r.value} />)}
            </Picker>
        </FieldWrapper>

        <Text style={styles.label}>Gender *</Text>
        <FieldWrapper iconName="accessibility-outline">
            <Picker selectedValue={form.sex} onValueChange={(v) => handleChange("sex", v)} style={styles.picker}>
                <Picker.Item label="Select Gender" value="" />
                <Picker.Item label="Male" value="Male" /><Picker.Item label="Female" value="Female" /><Picker.Item label="Other" value="Other" />
            </Picker>
        </FieldWrapper>

        <Text style={styles.label}>Areas</Text>
        <FieldWrapper iconName="location-outline">
            <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                mode="modal" // ✨ Isse bada popup khulega
                search
                maxHeight={400}
                labelField="name"
                valueField="id"
                placeholder="Search Area..."
                searchPlaceholder="Type area name..."
                value={form.area_id}
                data={[...areas, { id: OTHER_AREA_VALUE, name: "Other (Enter below)" }]}
                onChange={item => handleAreaChange(item.id)}
            />
        </FieldWrapper>
        
        {form.area_id === OTHER_AREA_VALUE && (
            <FieldWrapper iconName="pencil-outline">
                <TextInput style={styles.textInput} placeholder="Enter New Area Name *" value={form.custom_area_name} onChangeText={(t) => handleChange("custom_area_name", t)}/>
            </FieldWrapper>
        )}

        <Text style={styles.label}>Zone (Auto-selected)</Text>
        <FieldWrapper iconName="compass-outline" disabled={true}>
            <Picker selectedValue={form.zone_id} enabled={false} style={[styles.picker, styles.pickerDisabled]}>
                <Picker.Item label={form.zone_id ? zones.find(z => z.id === form.zone_id)?.name : "Select Area First"} value={form.zone_id} />
            </Picker>
        </FieldWrapper>

        <Text style={styles.label}>Seeker Type *</Text>
        <FieldWrapper iconName="people-outline" disabled={isRoleRestricted}>
            <Picker selectedValue={typeValue} onValueChange={(v) => handleChange("type", v)} enabled={!isRoleRestricted} style={styles.picker}>
                {!isRoleRestricted && <Picker.Item label="Select Type" value="" />}
                <Picker.Item label="Pratishthan" value="1" />
                <Picker.Item label="Public" value="2" />
            </Picker>
        </FieldWrapper>

        <Text style={styles.requiredText}>* Indicates Required Field</Text>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, padding: 20, backgroundColor: BACKGROUND_COLOR, paddingBottom: PADDING_BOTTOM },
    sectionTitle: { fontSize: 16, fontWeight: "600", color: PRIMARY_COLOR, marginBottom: 15 },
    label: { marginBottom: 5, marginTop: 15, fontWeight: "600", color: "#555", fontSize: 13 },
    headerSaveText: { color: PRIMARY_COLOR, fontSize: 17, fontWeight: '600' },
    fieldWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: BORDER_COLOR, marginBottom: 10, paddingHorizontal: 15, minHeight: 50 },
    fieldDisabled: { backgroundColor: '#F5F5F5' },
    inputIcon: { marginRight: 15 },
    textInput: { flex: 1, fontSize: 16, color: '#333' },
    picker: { flex: 1, marginLeft: -10, color: '#333' },
    pickerDisabled: { color: SUBTLE_COLOR },
    dropdown: { flex: 1, height: 50 },
    placeholderStyle: { fontSize: 16, color: '#9E9E9E' },
    selectedTextStyle: { fontSize: 16 },
    inputSearchStyle: { height: 45, fontSize: 16, borderRadius: 8 },
    requiredText: { fontSize: 12, color: ERROR_COLOR, marginTop: 10, textAlign: 'right' },
});