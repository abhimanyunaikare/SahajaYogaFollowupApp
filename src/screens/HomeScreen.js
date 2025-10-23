import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "../api/apiClient";

export default function HomeScreen() {
  const [totalSeekers, setTotalSeekers] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchSeekers = async () => {
      try {
        const response = await api.get("/seekers"); // or /seekers/count
        setTotalSeekers(response.data.length || response.data.count || 0);
      } catch (error) {
        console.log("Error fetching seekers:", error.message);
      }
    };
    fetchSeekers();
  }, []);

  const menuItems = [
    { id: "1", title: "Seekers", icon: "people", color: "#4CAF50", route: "/seekers" },
    { id: "2", title: "Add Seeker", icon: "person-add", color: "#2196F3", route: "/addSeeker" },
    { id: "3", title: "Reports", icon: "bar-chart", color: "#FF9800", route: "/reports" },
    { id: "4", title: "Logout", icon: "log-out", color: "#F44336", route: "/login" },
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: item.color }]}
      onPress={() => router.push(item.route)} // ✅ useRouter navigation
    >
      <Ionicons name={item.icon} size={28} color="#fff" />
      <Text style={styles.cardText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome  🙏</Text>

      <FlatList
        data={menuItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <View style={styles.statsCard}>
        <Text style={styles.statsCount}>{totalSeekers}</Text>
        <Text style={styles.statsLabel}>Total Seekers</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 30 },
  row: { justifyContent: "space-between", marginBottom: 20 },
  card: {
    flex: 1,
    height: 120,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    elevation: 4,
  },
  cardText: { color: "#fff", marginTop: 10, fontSize: 16, fontWeight: "600" },
  statsCard: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginTop: 30,
  },
  statsCount: { fontSize: 36, fontWeight: "bold", color: "#1565C0" },
  statsLabel: { fontSize: 16, color: "#555", marginTop: 4 },
});
