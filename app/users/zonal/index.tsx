import React, { useEffect, useState } from "react";
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator, 
    Platform 
} from "react-native";
import { useRouter , Stack} from "expo-router";
import api from "../../../src/api/apiClient.js"; 
import { Ionicons } from "@expo/vector-icons";

// --- Constants for Minimalist Card Design ---
const PRIMARY_COLOR = "#007AFF"; // Blue
const ACCENT_COLOR = "#4CAF50"; // Green for positive counts/assigned
const TEXT_COLOR = "#212121";
const SUBTLE_TEXT_COLOR = "#757575";
const WARNING_COLOR = "#F44336"; // Red for unassigned/critical items
const BACKGROUND_COLOR = "#F4F4F4"; // Light grey screen background
const ITEM_BACKGROUND = "#FFFFFF"; // Pure white card background

// Renamed the component for clarity
export default function ZoneStatisticsScreen() {
  const [zones, setZones] = useState([]); // RENAMED: from 'members' to 'zones'
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchZoneStatistics = async () => {
      try {
        // CHANGED: Call the API endpoint that returns the zone statistics
        const response = await api.get("/zones/statistics"); 
        setZones(response.data);
      } catch (error) {
        console.log("Error fetching zone statistics:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchZoneStatistics();
  }, []);

  // UPDATED: Handle navigation for a zone (e.g., to view its detailed members or seekers)
  const handleZonePress = (zoneId, zoneName) => {
    // You can define a new route here, perhaps to a list of seekers in that zone.
    router.push(`/users/zonal/${zoneId}/moderators?name=${zoneName}`);
};

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color={PRIMARY_COLOR} />;
  }
  
  // Component to display when the list is empty
  const EmptyList = () => (
    <View style={styles.emptyContainer}>
        <Ionicons name="compass-outline" size={40} color={SUBTLE_TEXT_COLOR} />
        <Text style={styles.emptyText}>No zones or statistics found.</Text>
    </View>
  );

  // Helper component for count rows
  const CountRow = ({ iconName, label, count, color }) => (
    <View style={styles.detailRow}>
        <Ionicons name={iconName} size={14} color={color} />
        <Text style={[styles.countText, { color }]}>
            {count} {label}
        </Text>
    </View>
  );


  return (
     <>
      <Stack.Screen
        options={{
          title: "Zone Statistics",
          // The title is concise and clear
        }}
      />
        <View style={styles.container}>
          <FlatList
            data={zones}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.itemCard}
                onPress={() => handleZonePress(item.id, item.name)} // Pass zone details
              >
                {/* 🧭 Zone Icon */}
                <Ionicons 
                    name="map-outline" // Changed icon to represent a zone
                    size={36} 
                    color={PRIMARY_COLOR} 
                    style={styles.memberIcon} 
                />

                <View style={styles.itemContent}>
                    {/* Zone Name (Most Prominent) */}
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    
                    {/* 1. Total Moderators */}
                    <CountRow 
                        iconName="people-circle-outline" 
                        label="Mentors" 
                        count={item.moderators_count} 
                        color={PRIMARY_COLOR}
                    />

                    {/* 2. Total Seekers */}
                    <CountRow 
                        iconName="people-outline" 
                        label="Total Seekers" 
                        count={item.seekers_count} 
                        color={TEXT_COLOR}
                    />
                    
                    {/* 3. Seekers Assigned */}
                    <CountRow 
                        iconName="checkmark-circle-outline" 
                        label="Seekers Assigned" 
                        count={item.seekers_assigned_count} 
                        color={ACCENT_COLOR}
                    />

                    {/* 4. Seekers Unassigned (Use Warning Color) */}
                    <CountRow 
                        iconName="alert-circle-outline" 
                        label="Seekers Unassigned" 
                        count={item.seekers_unassigned_count} 
                        color={WARNING_COLOR}
                    />
                </View>
                
                {/* ➡️ Navigation Indicator */}
                <Ionicons name="chevron-forward" size={20} color={SUBTLE_TEXT_COLOR} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={EmptyList}
            contentContainerStyle={styles.listContent}
          />
        </View>
       </>
  );
}

const styles = StyleSheet.create({
  container: { 
      flex: 1, 
      backgroundColor: BACKGROUND_COLOR 
    },
  loader: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: BACKGROUND_COLOR 
    },
  listContent: {
      paddingHorizontal: 15,
      paddingVertical: 15,
  },
  
  // --- Optimized Card Styles ---
  itemCard: {
    backgroundColor: ITEM_BACKGROUND,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15, // Uniform padding
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  memberIcon: { // Renamed from memberIcon conceptually, but kept for styling consistency
    marginRight: 15,
    opacity: 0.8,
  },
  itemContent: {
      flex: 1,
  },
  itemTitle: { 
      fontSize: 18, // Slightly larger for the Zone name
      fontWeight: "700", 
      color: TEXT_COLOR,
      marginBottom: 8, // Added space below title
    },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4, // Increased spacing between rows
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  
  // --- Empty State Styles ---
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ITEM_BACKGROUND,
    borderRadius: 8,
    marginTop: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: SUBTLE_TEXT_COLOR,
    textAlign: 'center',
  }
});