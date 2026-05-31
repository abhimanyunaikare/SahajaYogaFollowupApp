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
import { Dropdown } from "react-native-element-dropdown";

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
const PUBLIC_TYPE_VALUE = "2"; // Show location field only for Public
const OUTSIDE_PUNE_NAME = "Outside Pune District"; // matched by name from DB

// --- FieldWrapper Component ---
const FieldWrapper = ({ children, iconName, disabled = false }) => (
  <View style={[styles.fieldWrapper, disabled && styles.fieldDisabled]}>
    <Ionicons
      name={iconName}
      size={20}
      color={disabled ? SUBTLE_COLOR : PRIMARY_COLOR}
      style={styles.inputIcon}
    />
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
    address: "", // location field for Public type
  });

  const [duplicateMobile, setDuplicateMobile] = useState(null); // { mobile, seekerId? }
  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const navigation = useNavigation();

  const typeValue = isRoleRestricted ? FIXED_TYPE_VALUE : form.type;
  const isPublicType = typeValue === PUBLIC_TYPE_VALUE;

  // Area classification
  const isOtherArea = form.area_id === OTHER_AREA_VALUE; // hardcoded "0", not from DB
  const selectedAreaObj = areas.find((a) => a.id === form.area_id);
  const isOutsidePune =
    !isOtherArea && selectedAreaObj?.name?.trim() === OUTSIDE_PUNE_NAME;
  // Normal area = real DB area that has a zone (neither Other nor Outside Pune)
  const isNormalArea = !!form.area_id && !isOtherArea && !isOutsidePune;

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
      const selectedArea = areas.find((area) => String(area.id) === areaId);
      if (selectedArea) newZoneId = String(selectedArea.zone_id);
    }
    setForm((prevForm) => ({
      ...prevForm,
      area_id: areaId,
      zone_id: newZoneId,
      custom_area_name:
        areaId !== OTHER_AREA_VALUE ? "" : prevForm.custom_area_name,
    }));
  };

  const handleChange = (key, value) => {
    if (key === "type" && isRoleRestricted) return;
    if (key === "mobile") setDuplicateMobile(null); // clear on edit
    setForm((prevForm) => ({ ...prevForm, [key]: value }));
  };

  // --- Error parser: extracts human-readable message from API error ---
  const parseApiError = (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    // Laravel validation errors come as { errors: { field: ["msg"] } }
    if (status === 422 && data?.errors) {
      const firstField = Object.keys(data.errors)[0];
      const firstMsg = data.errors[firstField]?.[0];

      // Detect duplicate mobile specifically
      if (firstField === "mobile" && 
        (firstMsg?.toLowerCase().includes("taken") || 
        firstMsg?.toLowerCase().includes("already registered"))) {
        return { type: "duplicate_mobile", message: firstMsg };
      }

      // Collect all validation messages
      const allMessages = Object.values(data.errors)
        .flat()
        .join("\n");
      return { type: "validation", message: allMessages };
    }

    if (status === 409) {
      return { type: "duplicate_mobile", message: data?.message || "Mobile already registered." };
    }

    if (status === 500) {
      return { type: "server", message: "Server error. Please try again later." };
    }

    if (status === 401 || status === 403) {
      return { type: "auth", message: "You are not authorized to perform this action." };
    }

    return {
      type: "unknown",
      message: data?.message || "Something went wrong. Please try again.",
    };
  };

  // --- Show duplicate-mobile alert with redirect option ---
  const showDuplicateMobileAlert = (mobile) => {
    setDuplicateMobile({ mobile });
  };

  const handleSubmit = useCallback(async () => {
    if (isSaving) return;
    const mobileNumber = form.mobile.trim();

    if (!form.first_name.trim() || !mobileNumber || !form.sex || !typeValue) {
      Alert.alert(
        "Missing Fields",
        "Please fill First Name, Mobile, Gender, and Type."
      );
      return;
    }

    if (mobileNumber.length !== 10) {
      Alert.alert("Invalid Mobile", "Mobile number must be exactly 10 digits.");
      return;
    }

    // Area validation
    if (!form.area_id) {
      Alert.alert("Missing Field", "Please select an area.");
      return;
    }

    // If Other selected, custom name is required
    if (isOtherArea && !form.custom_area_name.trim()) {
      Alert.alert("Missing Field", "Please enter the new area name.");
      return;
    }

    // Normal area must have an auto-populated zone
    if (isNormalArea && !form.zone_id) {
      Alert.alert(
        "Missing Zone",
        "The selected area does not have a zone assigned. Please contact admin or choose a different area."
      );
      return;
    }

    setIsSaving(true);
    try {
      const dataToSend = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        mobile: mobileNumber,
        age_range: form.age_range || null,
        sex: form.sex,
        // Area/zone logic:
        //   Other (hardcoded "0")  → area_id: null, zone_id: null, comment = custom name
        //   Outside Pune (from DB) → area_id: real id, zone_id: null
        //   Normal area (from DB)  → area_id: real id, zone_id: auto-populated
        area_id: isOtherArea ? null : Number(form.area_id),
        zone_id: isOtherArea || isOutsidePune ? null : form.zone_id ? Number(form.zone_id) : null,
        type: Number(typeValue),
        comment: isOtherArea
          ? `New Area: ${form.custom_area_name.trim()}`
          : null,
        // Only send address for Public type
        address: isPublicType ? form.address.trim() || null : null,
      };

      await api.post("/seekers", dataToSend);
      Alert.alert("Success", "Seeker added successfully!", [
        { text: "OK", onPress: () => router.replace("/seekers") },
      ]);
    } catch (error) {
      const parsed = parseApiError(error);

      if (parsed.type === "duplicate_mobile") {
        showDuplicateMobileAlert(mobileNumber);
      } else {
        Alert.alert(
          parsed.type === "validation" ? "Validation Error" : "Error",
          parsed.message
        );
      }
    } finally {
      setIsSaving(false);
    }
  }, [form, isSaving, router, typeValue, isOtherArea, isOutsidePune, isNormalArea, isPublicType]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [zonesRes, areasRes] = await Promise.all([
          api.get("/zones"),
          api.get("/areas"),
        ]);
        setZones(zonesRes.data.map((z) => ({ ...z, id: String(z.id) })));
        setAreas(
          areasRes.data.map((a) => ({
            ...a,
            id: String(a.id),
            zone_id: String(a.zone_id),
          }))
        );
      } catch (e) {
        console.log(e);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: "Add New Seeker",
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSaving}
          style={{ marginRight: 15 }}
        >
          {isSaving ? (
            <ActivityIndicator color={PRIMARY_COLOR} />
          ) : (
            <Text style={styles.headerSaveText}>Save</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [handleSubmit, isSaving, navigation]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Seeker Information</Text>

        <FieldWrapper iconName="person-outline">
          <TextInput
            style={styles.textInput}
            placeholder="First Name *"
            value={form.first_name}
            onChangeText={(t) => handleChange("first_name", t)}
          />
        </FieldWrapper>

        <FieldWrapper iconName="person-circle-outline">
          <TextInput
            style={styles.textInput}
            placeholder="Last Name"
            value={form.last_name}
            onChangeText={(t) => handleChange("last_name", t)}
          />
        </FieldWrapper>

        <FieldWrapper iconName="call-outline">
          <TextInput
            style={styles.textInput}
            placeholder="Mobile *"
            keyboardType="phone-pad"
            maxLength={10}
            value={form.mobile}
            onChangeText={(t) => handleChange("mobile", t)}
          />
        </FieldWrapper>

        {duplicateMobile && (
          <View style={styles.duplicateBanner}>
            <Ionicons name="warning-outline" size={16} color="#B45309" style={{ marginRight: 6 }} />
            <Text style={styles.duplicateBannerText}>
              Mobile <Text style={{ fontWeight: "700" }}>{duplicateMobile.mobile}</Text> is already registered.
            </Text>
            <TouchableOpacity
              style={styles.duplicateViewBtn}
              onPress={async () => {
                try {
                  const res = await api.get(`/seekers/by-mobile/${duplicateMobile.mobile}`);
                  router.push(`/seeker/${res.data.id}`);
                } catch {
                  // fallback to list search if lookup fails
                  router.push({ pathname: "/seekers", params: { search: duplicateMobile.mobile } });
                }
              }}
            >
              <Text style={styles.duplicateViewBtnText}>View Seeker</Text>
              <Ionicons name="arrow-forward" size={13} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Age Range</Text>
        <FieldWrapper iconName="calendar-outline">
          <Picker
            selectedValue={form.age_range}
            onValueChange={(v) => handleChange("age_range", v)}
            style={styles.picker}
          >
            {ageRanges.map((r) => (
              <Picker.Item key={r.value} label={r.label} value={r.value} />
            ))}
          </Picker>
        </FieldWrapper>

        <Text style={styles.label}>Gender *</Text>
        <FieldWrapper iconName="accessibility-outline">
          <Picker
            selectedValue={form.sex}
            onValueChange={(v) => handleChange("sex", v)}
            style={styles.picker}
          >
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </FieldWrapper>

        <Text style={styles.label}>Seeker Type *</Text>
        <FieldWrapper iconName="people-outline" disabled={isRoleRestricted}>
          <Picker
            selectedValue={typeValue}
            onValueChange={(v) => handleChange("type", v)}
            enabled={!isRoleRestricted}
            style={styles.picker}
          >
            {!isRoleRestricted && (
              <Picker.Item label="Select Type" value="" />
            )}
            <Picker.Item label="Pratishthan" value="1" />
            <Picker.Item label="Public" value="2" />
          </Picker>
        </FieldWrapper>

        {/* Location field — only shown for Public type */}
        {isPublicType && (
          <>
            <Text style={styles.label}>Location of Program</Text>
            <FieldWrapper iconName="map-outline">
              <TextInput
                style={styles.textInput}
                placeholder="Enter Location of Program"
                value={form.address}
                onChangeText={(t) => handleChange("address", t)}
                multiline={false}
              />
            </FieldWrapper>
          </>
        )}

        <Text style={styles.label}>Area *</Text>
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
            placeholder="Search Area... *"
            searchPlaceholder="Type area name..."
            value={form.area_id}
            data={[
              ...areas,
              { id: OTHER_AREA_VALUE, name: "Other (Enter below)" },
            ]}
            onChange={(item) => handleAreaChange(item.id)}
          />
        </FieldWrapper>

        {isOtherArea && (
          <FieldWrapper iconName="pencil-outline">
            <TextInput
              style={styles.textInput}
              placeholder="Enter New Area Name *"
              value={form.custom_area_name}
              onChangeText={(t) => handleChange("custom_area_name", t)}
            />
          </FieldWrapper>
        )}

        <Text style={styles.label}>
          Zone {isNormalArea ? "(Auto-selected) *" : "(Auto-selected)"}
        </Text>
        <FieldWrapper iconName="compass-outline" disabled={true}>
          <Picker
            selectedValue={form.zone_id}
            enabled={false}
            style={[styles.picker, styles.pickerDisabled]}
          >
            <Picker.Item
              label={
                isOtherArea
                  ? "N/A — Other area"
                  : isOutsidePune
                  ? "N/A — Outside Pune District"
                  : form.zone_id
                  ? zones.find((z) => z.id === form.zone_id)?.name ?? "Unknown Zone"
                  : "Select Area First"
              }
              value={form.zone_id}
            />
          </Picker>
        </FieldWrapper>

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
  headerSaveText: { color: PRIMARY_COLOR, fontSize: 17, fontWeight: "600" },
  fieldWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 10,
    paddingHorizontal: 15,
    minHeight: 50,
  },
  fieldDisabled: { backgroundColor: "#F5F5F5" },
  inputIcon: { marginRight: 15 },
  textInput: { flex: 1, fontSize: 16, color: "#333" },
  picker: { flex: 1, marginLeft: -10, color: "#333" },
  pickerDisabled: { color: SUBTLE_COLOR },
  dropdown: { flex: 1, height: 50 },
  placeholderStyle: { fontSize: 16, color: "#9E9E9E" },
  selectedTextStyle: { fontSize: 16 },
  inputSearchStyle: { height: 45, fontSize: 16, borderRadius: 8 },
  requiredText: {
    fontSize: 12,
    color: ERROR_COLOR,
    marginTop: 10,
    textAlign: "right",
  },
  duplicateBanner: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    backgroundColor: "#FFFBEB",
    borderColor: "#FCD34D",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 4,
  },
  duplicateBannerText: {
    fontSize: 13,
    color: "#92400E",
    flex: 1,
    flexShrink: 1,
  },
  duplicateViewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
  },
  duplicateViewBtnText: {
    fontSize: 13,
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
});