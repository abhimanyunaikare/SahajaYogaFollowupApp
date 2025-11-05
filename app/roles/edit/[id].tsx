import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Text,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../src/api/apiClient";

export default function EditRoleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [form, setForm] = useState({ name: "", permissions: [] });
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roleRes, permRes] = await Promise.all([
          api.get(`/roles/${id}`),
          api.get("/permissions"),
        ]);

        const role = roleRes.data;
        const allPermissions = permRes.data;
        
        console.log("Permissions fetched:", permRes.data);

        setPermissions(allPermissions);

        // Normalize role's permissions to numeric IDs
        const rolePermIds = (role.permissions || []).map((p) =>
          typeof p === "object" ? Number(p.id) : Number(p)
        );

        setForm({
          name: role.name || "",
          permissions: rolePermIds,
        });
      } catch (error) {
        console.log("Error fetching role or permissions:", error.message);
        Alert.alert("Error", "Failed to fetch role details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  

  // ✅ Toggle single permission only
  const togglePermission = (permId) => {
    setForm((prev) => {
      const idNum = Number(permId);
      const exists = prev.permissions.includes(idNum);

      const updatedPermissions = exists
        ? prev.permissions.filter((pid) => pid !== idNum)
        : [...prev.permissions, idNum];

      return { ...prev, permissions: updatedPermissions };
    });
  };

  
  const handleUpdate = async () => {
    try {
      await api.put(`/roles/${id}`, form);
      Alert.alert("Success", "Role updated successfully!");
      router.replace("/roles");
    } catch (error) {
      console.log("Error updating role:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to update role");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Role</Text>

      <TextInput
        style={styles.input}
        placeholder="Role Name"
        value={form.name}
        onChangeText={(text) => setForm({ ...form, name: text })}
      />

      <Text style={styles.subtitle}>Select Permissions:</Text>

      {permissions.map((perm, index) => {
        const idNum = Number(perm.id);
        const safeKey = !isNaN(idNum) ? idNum : `perm-${index}`; // fallback key

        const isSelected = form.permissions.includes(idNum);

        return (
          <TouchableOpacity
            key={safeKey}
            style={styles.checkboxContainer}
            onPress={() => !isNaN(idNum) && togglePermission(idNum)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                isSelected && styles.checkboxSelected,
              ]}
            >
              {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.permissionText}>{perm.name || 'Unnamed Permission'}</Text>
          </TouchableOpacity>
        );
      })}


      <Button title="Save Changes" onPress={handleUpdate} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  subtitle: { fontSize: 16, fontWeight: "600", marginVertical: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: "#007AFF",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  permissionText: { fontSize: 15 },
});
