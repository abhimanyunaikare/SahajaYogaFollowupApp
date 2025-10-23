import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/apiClient";
import { useRouter } from "expo-router";

export default function SeekersListScreen() {
  const [seekers, setSeekers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchSeekers = async () => {
    try {
      const response = await api.get("/seekers"); // Make sure this route exists in Laravel
      setSeekers(response.data);
    } catch (error) {
      console.error("Error fetching seekers:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSeekers();
  }, []);

  const filteredSeekers = seekers.filter(
    (s) =>
      s.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.mobile?.includes(search)
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card}   onPress={() => router.push(`/seeker/${item.id}`)} // ✅ dynamic route
    >
      <View style={styles.cardHeader}>
        <Ionicons name="person-circle-outline" size={36} color="#2196F3" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
          <Text style={styles.city}>{item.zone}, {item.city || "City N/A"}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Ionicons name="call-outline" size={16} color="#555" />
        <Text style={styles.mobile}>{item.mobile}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seekers List</Text>

      <TextInput
        style={styles.searchBox}
        placeholder="Search by name or mobile..."
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredSeekers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchSeekers();
            }}
          />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 15 },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  searchBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#E3F2FD",
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 18, fontWeight: "bold" },
  city: { fontSize: 14, color: "#666" },
  cardFooter: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  mobile: { fontSize: 14, marginLeft: 6, color: "#333" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
