import React, { useEffect, useState, useContext } from "react";
import { View, Text, Alert, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AuthContext } from "../../src/context/AuthContext";
import api from "../api/apiClient";

export default function HomeScreen() {
    const [totalSeekers, setTotalSeekers] = useState(0);
    const [stats, setStats] = useState(null);
    const router = useRouter();
    const { user, logout } = useContext(AuthContext);


    useEffect(() => {
      console.log("👤 Logged-in user from context:", user);
      console.log("Permissions:", user?.permissions);

    }, [user]);

    useEffect(() => {
      const fetchSeekers = async () => {
        try {
          const response = await api.get("/dashboard/stats");
          setStats(response.data);  
          console.log('stats',response.data.unallocated_seekers)
        } catch (error) {
          console.log("Error fetching stat:", error.message);
        }
      };
      fetchSeekers();
    }, []);

    const menuItems = [
      { id: "1", title: "Seekers", icon: "people", color: "#4CAF50", route: "/seekers" },
      { id: "2", title: "Add Seeker", icon: "person-add", color: "#2196F3", route: "/addSeeker" , permissionId: 1 },
      { id: "3", title: "Reports", icon: "bar-chart", color: "#FF9800", route: "/reports" , permissionId: 7 },
      { id: "4", title: "Roles", icon: "key-outline", color: "#ac50f2", route: "/roles" , permissionId: 5 },
      { id: "5", title: "Users", icon: "person-circle-outline", color: "#22d6d6", route: "/users" , permissionId: 3 },
      { id: "6", title: "Logout", icon: "log-out", color: "#F44336"},
    ];

    const handlePress = async (item) => {
      if (item.title === "Logout") {
        Alert.alert("Logout", "Are you sure you want to log out?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Logout",
            onPress: async () => {
              await logout();
              router.replace("/login"); // 👈 Redirect to login screen
            },
          },
        ]);
      } else {
        router.push(item.route);
      }
    };

    const accessibleMenuItems = menuItems.filter(
      (item) =>
        !item.permissionId || // show if no restriction
        user?.permissions?.includes(item.permissionId) // show if user has access
    );

    const renderItem = ({ item }) => (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: item.color }]}
        onPress={() => handlePress(item)} // 👈 Updated line
    >
        <Ionicons name={item.icon} size={28} color="#fff" />
        <Text style={styles.cardText}>{item.title}</Text>
      </TouchableOpacity>
    );

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome, {user?.name || "Guest"}! 🙏</Text>
        <Text style={styles.sub_title}>{user?.role_name || "No Role"}</Text>

        <FlatList
          data={accessibleMenuItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingBottom: 20 }}
        />

        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <Text style={styles.statsCount}>  {stats?.unallocated_seekers ?? 0}
</Text>
            <Text style={styles.statsLabel}>Unassigned Seekers</Text>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsCount}>  {stats?.total_seekers ?? 0}
</Text>
            <Text style={styles.statsLabel}>Total Seekers</Text>
          </View>
        </View>

      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 20 },
    title: { fontSize: 14, fontWeight: "bold", textAlign: "left", marginBottom: 8 },
    sub_title: { fontSize: 12, textAlign: "left", marginBottom: 30 },
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
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 30,
      gap: 10, // adds spacing between cards (works in RN 0.71+)
    },
    
    statsCard: {
      flex: 1,
      backgroundColor: "#E3F2FD",
      borderRadius: 12,
      padding: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    
    statsCount: { fontSize: 36, fontWeight: "bold", color: "#1565C0" },
    statsLabel: { fontSize: 16, color: "#555", marginTop: 4 },
});
