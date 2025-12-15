import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack} from "expo-router";
import api from "../../../src/api/apiClient.js"; // Assuming this is your API client path
import { Ionicons } from "@expo/vector-icons";

// Assuming this file is located at /app/users/seekers/[memberId].js
export default function SeekersListScreen() {
  const { memberId, name } = useLocalSearchParams(); // memberId from route, name from query param
  const [seekers, setSeekers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberId) return; // Wait until memberId is available

    const fetchSeekers = async () => {
      try {
        // --- API Call to fetch seekers assigned to a specific member ID ---
        const response = await api.get(`/users/callingteammembers/${memberId}`);
        setSeekers(response.data);
      } catch (error) {
        console.log(`Error fetching seekers for member ${memberId}:`, error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSeekers();
  }, [memberId]);

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />;
  }
  
  // Helper function for date formatting (already in your renderItem)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
  };

  return (
     <>
      <Stack.Screen
        options={{
          // Use the member's name in the header for context
          title: name ? `${name}'s Seekers` : "Assigned Seekers",
        }}
      />
        <View style={styles.container}>
          
          {/* 👇 DISPLAY TOTAL COUNT HERE */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>
              Total Seekers Allocated: 
              <Text style={styles.countNumber}> {seekers.length}</Text>
            </Text>
          </View>
          {/* --------------------------- */}

          {seekers.length === 0 ? (
              <Text style={styles.emptyText}>No seekers currently assigned to this member.</Text>
          ) : (
            <FlatList
              data={seekers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  // Example: onPress={() => router.push(`/seekers/${item.id}`)}
                >
                  <View style={styles.itemContent}>
                      <Text style={styles.itemTitle}>{item.first_name +' '+ item.last_name}</Text>
                      <Text style={styles.itemSubtitle}>Status: {item.status}</Text>
                      <Text style={styles.itemSubtitle}>Start Date: {formatDate(item.created_at)}</Text>
                  </View>
                  <Ionicons name="person-circle-outline" size={24} color="#007AFF" />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
       </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", paddingHorizontal: 10 }, // Added padding for the list
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // NEW STYLES FOR COUNT
  summaryBox: {
    padding: 12,
    backgroundColor: '#E8F5E9', // Light green for positive/summary feel
    borderRadius: 8,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50', // Green accent
    marginBottom: 15,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  countNumber: {
    fontWeight: 'bold',
    color: '#388E3C', // Darker green for count emphasis
    fontSize: 18,
  },
  // END NEW STYLES
  
  item: {
    padding: 15,
    backgroundColor: "#fff",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 8, // Added margin bottom for spacing between items
    elevation: 1, // Optional shadow for Android
  },
  itemContent: {
      flex: 1,
  },
  itemTitle: { fontSize: 16, fontWeight: "600", color: '#333' },
  itemSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  separator: {
    // Removed separator since items now have margin
    height: 0, 
  },
  emptyText: {
      textAlign: 'center',
      marginTop: 50,
      fontSize: 16,
      color: '#666',
  }
});