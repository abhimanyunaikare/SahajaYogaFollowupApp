import React, { useEffect, useState } from "react";
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator,
    Platform,
    SafeAreaView 
} from "react-native";
import { useLocalSearchParams, Stack, useRouter} from "expo-router";
import api from "../../../src/api/apiClient.js"; 
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// --- Theme Constants ---
const PRIMARY_COLOR = "#007AFF"; 
const SUCCESS_COLOR = "#34C759"; 
const WARNING_COLOR = "#FF9500"; 
const TEXT_COLOR = "#1C1C1E";
const SUBTLE_TEXT_COLOR = "#8E8E93";
const BACKGROUND_COLOR = "#F2F2F7"; 
const ITEM_BACKGROUND = "#FFFFFF"; 
const DANGER_COLOR = "#FF3B30";

export default function SeekersListScreen() {
  const { memberId, name } = useLocalSearchParams(); 
  const [seekers, setSeekers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!memberId) return;

    const fetchSeekers = async () => {
      try {
        const response = await api.get(`/users/callingteammembers/${memberId}`);
        setSeekers(response.data);
      } catch (error) {
        console.log(`Error fetching seekers:`, error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSeekers();
  }, [memberId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
    });
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
     <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: name ? `${name}'s Seekers` : "Assigned Seekers",
        }}
      />
        <View style={{ flex: 1 }}>
          <FlatList
            data={seekers}
            keyExtractor={(item) => item.id.toString()}
            // 🚀 Padding Fix: Bottom Nav ke liye extra jagah
            contentContainerStyle={styles.listContent}
            ListFooterComponent={<View style={{ height: 150 }} />}
            
            ListHeaderComponent={() => (
              <View style={styles.summaryBox}>
                <Ionicons name="people" size={20} color="#388E3C" />
                <Text style={styles.summaryText}>
                  Total Allocated: <Text style={styles.countNumber}>{seekers.length}</Text>
                </Text>
              </View>
            )}

            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.itemCard}
                onPress={() => router.push(`/seeker/${item.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.itemContent}>
                    {/* Top Row: Name and Status */}
                    <View style={styles.titleRow}>
                      <Text style={styles.itemTitle}>{item.first_name} {item.last_name}</Text>
                      <View style={styles.statusIcons}>
                          {/* Called Icon: check 'called' field or 'caller_id' */}
                          <Ionicons 
                              name={item.caller ? "call" : "call-outline"} 
                              size={16} 
                              color={item.caller ? SUCCESS_COLOR : WARNING_COLOR} 
                          />
                          {/* Assigned Icon */}
                          <Ionicons 
                              name={item.moderator ? "person-outline" : "person-remove-outline"} 
                              size={18} 
                              color={item.moderator ? SUCCESS_COLOR : DANGER_COLOR} 
                              style={{ marginLeft: 8 }} 
                          />                                    
                      </View>
                  </View>

                    {/* Middle Row: Phone */}
                    <View style={styles.detailRow}>
                        <Ionicons name="phone-portrait-outline" size={14} color={SUBTLE_TEXT_COLOR} />
                        <Text style={styles.subtitle}>{item.mobile || 'N/A'}</Text>
                    </View>
                    
                    {/* Bottom Row: Date Badges */}
                    <View style={styles.dateRow}>
                        <View style={styles.dateBadge}>
                            <MaterialCommunityIcons name="calendar-plus" size={12} color="#555" />
                            <Text style={styles.dateText}>Start: {formatDate(item.created_at)}</Text>
                        </View>
                        <View style={[styles.dateBadge, { marginLeft: 10 }]}>
                            <MaterialCommunityIcons name="calendar-sync" size={12} color="#555" />
                            <Text style={styles.dateText}>Upd: {formatDate(item.updated_at)}</Text>
                        </View>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="alert-circle-outline" size={50} color={SUBTLE_TEXT_COLOR} />
                <Text style={styles.emptyText}>No seekers currently assigned.</Text>
              </View>
            )}
          />
        </View>
       </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 12, paddingVertical: 10 },
  
  summaryBox: {
    padding: 15,
    backgroundColor: '#E8F5E9', 
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  summaryText: { fontSize: 15, color: '#333', marginLeft: 10, fontWeight: '500' },
  countNumber: { fontWeight: 'bold', color: '#2E7D32', fontSize: 18 },

  itemCard: {
    backgroundColor: ITEM_BACKGROUND,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
  },
  itemContent: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  itemTitle: { fontSize: 16, fontWeight: "700", color: TEXT_COLOR },
  statusIcons: { flexDirection: 'row', alignItems: 'center' },

  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  subtitle: { fontSize: 13, color: SUBTLE_TEXT_COLOR, marginLeft: 5 },

  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: "#F2F2F7", 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 4 
  },
  dateText: { fontSize: 11, color: "#555", marginLeft: 4, fontWeight: '500' },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 10, fontSize: 16, color: SUBTLE_TEXT_COLOR }
});