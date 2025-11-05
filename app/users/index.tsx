import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, RefreshControl, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "../../src/api/apiClient";

export default function UsersListScreen() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    Alert.alert("Confirm", "Are you sure you want to delete this user?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/users/${id}`);
            fetchUsers();
          } catch (error) {
            Alert.alert("Error", "Failed to delete user");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Ionicons name="person-circle-outline" size={40} color="#2196F3" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.role.name}</Text>
          <Text style={styles.mobile}>📍 {item.zone}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => router.push(`/users/edit/${item.id}`)}>
            <Ionicons name="create-outline" size={22} color="#4CAF50" />
          </TouchableOpacity>
          {/* <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={22} color="#F44336" />
          </TouchableOpacity> */}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Users List</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/users/add")}
        >
          <Ionicons name="add-circle" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchUsers} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#fff" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: { fontSize: 22, fontWeight: "bold" },
  addButton: {
    backgroundColor: "#2196F3",
    borderRadius: 20,
    padding: 6,
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 18, fontWeight: "bold" },
  email: { color: "#666", fontSize: 14 },
  mobile: { color: "#555", marginTop: 3 },
  actions: { flexDirection: "row", gap: 12, marginLeft: 10 },
});
