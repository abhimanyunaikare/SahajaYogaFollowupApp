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

// --- Constants ---
const PRIMARY_COLOR = "#007AFF"; 
const ACCENT_COLOR = "#4CAF50"; 
const TEXT_COLOR = "#212121";
const SUBTLE_TEXT_COLOR = "#757575";
const WARNING_COLOR = "#F44336"; 
const BACKGROUND_COLOR = "#F4F4F4"; 
const ITEM_BACKGROUND = "#FFFFFF"; 

export default function ZoneStatisticsScreen() {
  const [zones, setZones] = useState([]); 
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchZoneStatistics = async () => {
      try {
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

  // Specific Action Navigation
  const handleViewAction = (zoneId, zoneName, type) => {
    if (type === 'moderators') {
        router.push(`/users/zonal/${zoneId}/moderators?name=${zoneName}`);
    } else {
        // status: 'assigned' or 'unassigned'
        console.log(`${type}`);
        // router.push(`/seekers?zone_id=${zoneId}&assigned=${type}&name=${zoneName}`);
        router.push(`/users/zonal/${zoneId}/unassigned-seekers?name=${zoneName}`);
    }
  };

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color={PRIMARY_COLOR} />;
  }
  
  const EmptyList = () => (
    <View style={styles.emptyContainer}>
        <Ionicons name="compass-outline" size={40} color={SUBTLE_TEXT_COLOR} />
        <Text style={styles.emptyText}>No zones or statistics found.</Text>
    </View>
  );

  // Updated CountRow with Optional Button
  const CountRow = ({ iconName, label, count, color, onPress, showButton }) => (
    <View style={styles.detailRow}>
        <View style={styles.countInfo}>
            <Ionicons name={iconName} size={15} color={color} />
            <Text style={[styles.countText, { color }]}>
                {count} {label}
            </Text>
        </View>
        
        {showButton && (
            <TouchableOpacity 
                style={[styles.actionButton, { borderColor: color }]} 
                onPress={onPress}
            >
                <Text style={[styles.actionButtonText, { color }]}>View</Text>
                <Ionicons name="chevron-forward" size={12} color={color} />
            </TouchableOpacity>
        )}
    </View>
  );

  return (
     <>
      <Stack.Screen options={{ title: "Zone Statistics" }} />
        <View style={styles.container}>
          <FlatList
            data={zones}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <Ionicons 
                    name="map-outline" 
                    size={36} 
                    color={PRIMARY_COLOR} 
                    style={styles.zoneIcon} 
                />

                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    
                    {/* Mentors Row - With Button */}
                    <CountRow 
                        iconName="people-circle-outline" 
                        label="Mentors" 
                        count={item.moderators_count} 
                        color={PRIMARY_COLOR}
                        showButton={true}
                        onPress={() => handleViewAction(item.id, item.name, 'moderators')}
                    />

                    {/* Total Seekers - No Button */}
                    <CountRow 
                        iconName="people-outline" 
                        label="Total Seekers" 
                        count={item.seekers_count} 
                        color={TEXT_COLOR}
                    />
                    
                    {/* Assigned Seekers - With Button */}
                    <CountRow 
                        iconName="checkmark-circle-outline" 
                        label="Seekers Assigned" 
                        count={item.seekers_assigned_count} 
                        color={ACCENT_COLOR}
                        // showButton={true}
                        // onPress={() => handleViewAction(item.id, item.name, 'assigned')}
                    />

                    {/* Unassigned Seekers - With Button */}
                    <CountRow 
                        iconName="alert-circle-outline" 
                        label="Seekers Unassigned" 
                        count={item.seekers_unassigned_count} 
                        color={WARNING_COLOR}
                        showButton={true}
                        onPress={() => handleViewAction(item.id, item.name, 'unassigned')}
                    />
                </View>
              </View>
            )}
            ListEmptyComponent={EmptyList}
            contentContainerStyle={styles.listContent}
          />
        </View>
       </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 15, paddingVertical: 15, paddingBottom: 100 },
  
  itemCard: {
    backgroundColor: ITEM_BACKGROUND,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    padding: 15,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  zoneIcon: { marginRight: 15, marginTop: 5 },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 18, fontWeight: "700", color: TEXT_COLOR, marginBottom: 10 },
  
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  countInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  countText: { fontSize: 14, fontWeight: '600', marginLeft: 8 },
  
  // Action Button Styles
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  actionButtonText: { fontSize: 12, fontWeight: '700', marginRight: 2 },
  
  emptyContainer: { padding: 30, alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 10, fontSize: 16, color: SUBTLE_TEXT_COLOR }
});