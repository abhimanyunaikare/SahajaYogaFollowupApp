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
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router"; 
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/api/apiClient";
import { Dropdown } from 'react-native-element-dropdown'; // ✨ Added Dropdown import

// --- Constants ---
const PRIMARY_COLOR = "#007AFF"; 
const BORDER_COLOR = "#E0E0E0"; 
const BACKGROUND_COLOR = "#FFFFFF"; 
const PADDING_BOTTOM = 120; 
const OTHER_AREA_VALUE = "0"; 
const SUBTLE_COLOR = "#9E9E9E"; 

const FieldWrapper = ({ children, iconName, disabled = false }) => (
    <View style={[styles.fieldWrapper, disabled && styles.fieldDisabled]}>
        <Ionicons name={iconName} size={20} color={disabled ? SUBTLE_COLOR : PRIMARY_COLOR} style={styles.inputIcon} />
        {children}
    </View>
);

export default function EditSeekerScreen() {
  const { id } = useLocalSearchParams(); 
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
        custom_area_name: areaId === OTHER_AREA_VALUE ? prevForm.custom_area_name : "", 
    }));
  };

  const handleFollowupToggle = (value) => {
    if (value === true) {
        handleChange("interested_in_followup", true);
    } else {
        Alert.alert(
            "Confirmation",
            "Are you sure you want to mark this seeker as NOT interested?",
            [
                {
                    text: "Cancel",
                    onPress: () => handleChange("interested_in_followup", true),
                    style: "cancel", // Yeh button ko blue/bold rakhta hai
                },
                {
                    text: "Yes, Mark Uninterested",
                    onPress: () => handleChange("interested_in_followup", false),
                    style: "destructive", // ✨ Yeh button ko RED color mein dikhayega (iOS par)
                },
            ],
            { cancelable: false }
        );
    }
};

  const handleUpdate = useCallback(async () => {
    if (isSaving) return;

    if (form.area_id === OTHER_AREA_VALUE && !form.custom_area_name) {
        Alert.alert("Missing Area", "Please enter the name of the new area.");
        return;
    }
    
    const mobileNumber = form.mobile.trim();
    if (mobileNumber.length !== 10 || !/^\d+$/.test(mobileNumber)) {
        Alert.alert("Invalid Mobile", "Mobile number must be 10 digits.");
        return;
    }

    setIsSaving(true);
    try {
      const dataToSend = {
        ...form,
        mobile: mobileNumber,
        comment: form.area_id === OTHER_AREA_VALUE 
            ? `New Area: ${form.custom_area_name}` 
            : form.comment,
        zone_id: form.zone_id ? Number(form.zone_id) : null,
        area_id: (form.area_id && form.area_id !== OTHER_AREA_VALUE) ? Number(form.area_id) : null, 
        type: form.type ? Number(form.type) : 0,
        interested_in_followup: Boolean(form.interested_in_followup),
        called: Boolean(form.called),
        move_to_zonal_monitoring: Boolean(form.move_to_zonal_monitoring),
      };

      delete dataToSend.custom_area_name;
      delete dataToSend.age; 

      await api.put(`/seekers/${id}`, dataToSend);
      Alert.alert("Success", "Seeker updated successfully!");
      router.replace(`/seekers`); 
    } catch (error) {
      Alert.alert("Error", "Failed to update seeker.");
    } finally {
      setIsSaving(false);
    }
  }, [id, form, isSaving, router]);
  
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Edit Seeker Details",
      headerRight: () => (
        <TouchableOpacity onPress={handleUpdate} disabled={isSaving || loading} style={styles.headerSaveButton}>
          {isSaving ? <ActivityIndicator color={PRIMARY_COLOR} /> : <Text style={styles.headerSaveText}>Save</Text>}
        </TouchableOpacity>
      ),
    });
  }, [handleUpdate, isSaving, loading, navigation]);

  useEffect(() => {
    const fetchSeekerData = async () => {
      try {
        const [zonesRes, areasRes, seekerRes] = await Promise.all([
            api.get("/zones"),
            api.get("/areas"),
            api.get(`/seekers/${id}`),
        ]);
        
        const seeker = seekerRes.data;
        setZones(zonesRes.data.map(z => ({ ...z, id: String(z.id) })));
        setAreas(areasRes.data.map(a => ({ ...a, id: String(a.id), zone_id: String(a.zone_id) })));

        let initialAreaId = seeker.area_id ? String(seeker.area_id) : "";
        let initialCustomAreaName = "";
        const commentText = seeker.comment || "";
        
        if (!seeker.area_id && commentText.startsWith("New Area:")) {
            initialAreaId = OTHER_AREA_VALUE;
            initialCustomAreaName = commentText.replace("New Area: ", "").trim();
        }

        setForm(prevForm => ({
          ...prevForm,
          ...seeker,
          zone_id: seeker.zone_id ? String(seeker.zone_id) : "",
          type: seeker.type ? String(seeker.type) : "",
          area_id: initialAreaId, 
          custom_area_name: initialCustomAreaName, 
          comment: commentText, 
          interested_in_followup: Boolean(seeker.interested_in_followup),
          called: Boolean(seeker.called),
          move_to_zonal_monitoring: Boolean(seeker.move_to_zonal_monitoring),
        }));
      } catch (error) {
        Alert.alert("Error", "Unable to load seeker details.");
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
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20} 
    >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>      
        
        <Text style={styles.sectionTitle}>Seeker Details</Text>

        <Text style={styles.label}>First Name *</Text>
        <FieldWrapper iconName="person-outline">
            <TextInput style={styles.textInput} value={form.first_name} onChangeText={(t) => handleChange("first_name", t)}/>
        </FieldWrapper>

        <Text style={styles.label}>Last Name</Text>
        <FieldWrapper iconName="person-circle-outline">
            <TextInput style={styles.textInput} value={form.last_name} onChangeText={(t) => handleChange("last_name", t)}/>
        </FieldWrapper>

        <Text style={styles.label}>Mobile *</Text>
        <FieldWrapper iconName="call-outline" disabled={true}>
            <TextInput style={[styles.textInput, {color: SUBTLE_COLOR}]} value={form.mobile} editable={false}/>
        </FieldWrapper>

        <Text style={styles.label}>Occupation</Text>
        <FieldWrapper iconName="briefcase-outline">
            <TextInput style={styles.textInput} value={form.occupation} onChangeText={(t) => handleChange("occupation", t)}/>
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
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
            </Picker>
        </FieldWrapper>

        {/* 🌍 Updated Area Dropdown with Modal Search */}
        <Text style={styles.label}>Area</Text>
        <FieldWrapper iconName="location-outline">
            <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                mode="modal" 
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
            <>
                <Text style={styles.label}>New Area Name *</Text>
                <FieldWrapper iconName="pencil-outline">
                    <TextInput style={styles.textInput} value={form.custom_area_name} onChangeText={(t) => handleChange("custom_area_name", t)}/>
                </FieldWrapper>
            </>
        )}

        <Text style={styles.label}>Zone (Auto-selected)</Text>
        <FieldWrapper iconName="compass-outline" disabled={true}>
            <Picker selectedValue={form.zone_id} enabled={false} style={[styles.picker, styles.pickerDisabled]}>
                <Picker.Item label={form.zone_id ? zones.find(z => z.id === form.zone_id)?.name : "Not Applied"} value={form.zone_id} />
            </Picker>
        </FieldWrapper>

        <Text style={styles.label}>Seeker Type *</Text>
        <FieldWrapper iconName="people-outline">
            <Picker selectedValue={form.type} onValueChange={(v) => handleChange("type", v)} style={styles.picker}>
                <Picker.Item label="Select Type" value="" />
                <Picker.Item label="Pratishthan" value="1" />
                <Picker.Item label="Public" value="2" />
            </Picker>
        </FieldWrapper>

        <Text style={[styles.sectionTitle, { marginTop: 25 }]}>Status & Follow-up</Text>
        
        <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Seeker Called</Text>
            <View style={styles.switchWrapper}>
                <Text style={[styles.yesNoText, { color: !form.called ? "#F44336" : SUBTLE_COLOR }]}>No</Text>
                <Switch value={form.called} onValueChange={(v) => handleChange("called", v)} thumbColor={form.called ? PRIMARY_COLOR : "#F5F5F5"}/>
                <Text style={[styles.yesNoText, { marginLeft: 8, color: form.called ? PRIMARY_COLOR : SUBTLE_COLOR }]}>Yes</Text>
            </View>
        </View>

        <View style={[
            styles.switchContainer, 
            !form.interested_in_followup && { backgroundColor: '#FFF5F5' } // Agar NO hai toh halke red background
        ]}>
          <Text style={styles.switchLabel}>Interested in followup</Text>
          <View style={styles.switchWrapper}>
              <Text style={[styles.yesNoText, { color: !form.interested_in_followup ? "#F44336" : SUBTLE_COLOR }]}>No</Text>
              <Switch 
                  value={form.interested_in_followup} 
                  // ✨ Naya function yahan use karein
                  onValueChange={(v) => handleFollowupToggle(v)} 
                  thumbColor={form.interested_in_followup ? PRIMARY_COLOR : "#F5F5F5"}
              />
              <Text style={[styles.yesNoText, { marginLeft: 8, color: form.interested_in_followup ? PRIMARY_COLOR : SUBTLE_COLOR }]}>Yes</Text>
          </View>
      </View>

        <Text style={styles.label}>Notes/Comments</Text>
        <FieldWrapper iconName="chatbox-outline">
            <TextInput style={[styles.textInput, styles.multilineInput]} value={form.comment} onChangeText={(t) => handleChange("comment", t)} multiline numberOfLines={4}/>
        </FieldWrapper>
        
        <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Move to Zonal Coordinator</Text>
            <View style={styles.switchWrapper}>
                <Text style={[styles.yesNoText, { color: !form.move_to_zonal_monitoring ? "#F44336" : SUBTLE_COLOR }]}>No</Text>
                <Switch value={form.move_to_zonal_monitoring} onValueChange={(v) => handleChange("move_to_zonal_monitoring", v)} thumbColor={form.move_to_zonal_monitoring ? PRIMARY_COLOR : "#F5F5F5"}/>
                <Text style={[styles.yesNoText, { marginLeft: 8, color: form.move_to_zonal_monitoring ? PRIMARY_COLOR : SUBTLE_COLOR }]}>Yes</Text>
            </View>
        </View>

        <Text style={styles.requiredText}>* Indicates Required Field</Text>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    loader: { flex: 1, justifyContent: "center", alignItems: "center" },
    scrollContainer: { padding: 20, paddingBottom: PADDING_BOTTOM },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: PRIMARY_COLOR, marginBottom: 5 },
    label: { marginBottom: 5, marginTop: 15, fontWeight: "600", color: "#555", fontSize: 13 },
    headerSaveButton: { paddingHorizontal: 5 },
    headerSaveText: { color: PRIMARY_COLOR, fontSize: 17, fontWeight: '600' },
    fieldWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: BORDER_COLOR, marginBottom: 10, paddingHorizontal: 15, minHeight: 50 },
    fieldDisabled: { backgroundColor: '#F5F5F5' },
    inputIcon: { marginRight: 15 },
    textInput: { flex: 1, paddingVertical: 10, fontSize: 16, color: '#333' },
    picker: { flex: 1, marginLeft: -10 },
    pickerDisabled: { color: SUBTLE_COLOR },
    dropdown: { flex: 1, height: 50 },
    placeholderStyle: { fontSize: 16, color: '#9E9E9E' },
    selectedTextStyle: { fontSize: 16 },
    inputSearchStyle: { height: 45, fontSize: 16, borderRadius: 8 },
    multilineInput: { minHeight: 80, textAlignVertical: 'top' },
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: BORDER_COLOR, paddingHorizontal: 15, paddingVertical: 10, marginBottom: 10 },
    switchWrapper: { flexDirection: 'row', alignItems: 'center' },
    yesNoText: { fontSize: 14, fontWeight: '600' },
    requiredText: { fontSize: 12, color: '#F44336', marginTop: 10, textAlign: 'right' },
});