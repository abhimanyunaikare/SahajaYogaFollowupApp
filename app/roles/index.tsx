import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter , Stack} from "expo-router";
import api from "../../src/api/apiClient";
import { Ionicons } from "@expo/vector-icons";

export default function RolesScreen() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get("/roles");
        setRoles(response.data);
      } catch (error) {
        console.log("Error fetching roles:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#007AFF" />;
  }

  return (
     <>
      {/* Custom header instead of "users/index" */}
      <Stack.Screen
        options={{
          title: "Roles List",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/roles/add")}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="add-circle" size={26} color="#2196F3" />
            </TouchableOpacity>
          ),
        }}
      />
        <View style={styles.container}>
          
          {/* <Text style={styles.title}>Roles</Text>

          <TouchableOpacity style={styles.addButton} onPress={() => router.push("/roles/add")}>
            <Text style={styles.addButtonText}>+ Add Role</Text>
          </TouchableOpacity> */}

          <FlatList
            data={roles}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => router.push(`/roles/edit/${item.id}`)}
              >
                <Text style={styles.itemTitle}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
       </>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  item: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
  },
  itemTitle: { fontSize: 16, fontWeight: "600" },
  addButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  addButtonText: { color: "#fff", fontWeight: "bold" },
});
