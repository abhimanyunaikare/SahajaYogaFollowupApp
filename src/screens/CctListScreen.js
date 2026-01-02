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
import { useRouter , Stack} from "expo-router";
import api from "../../src/api/apiClient"; 
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// --- Theme Constants ---
const PRIMARY_COLOR = "#007AFF"; 
const TEXT_COLOR = "#1C1C1E";
const SUBTLE_TEXT_COLOR = "#8E8E93";
const BACKGROUND_COLOR = "#F2F2F7"; 
const ITEM_BACKGROUND = "#FFFFFF"; 

export default function TeamMembersScreen() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await api.get("/users/callingteammembers");
        setMembers(response.data);
      } catch (error) {
        console.log("Error fetching team members:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTeamMembers();
  }, []);

  const handleMemberPress = (memberId, memberName) => {
    router.push(`users/seekers/${memberId}?name=${memberName}`);
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
      <Stack.Screen options={{ title: "Calling Team" }} />
      
        <FlatList
          data={members}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          // 🚀 Bottom Navigation fix
          ListFooterComponent={<View style={{ height: 150 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemCard}
              onPress={() => handleMemberPress(item.id, item.name)}
              activeOpacity={0.7}
            >
              {/* Left Side: Avatar with Initials */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name?.substring(0, 2).toUpperCase()}</Text>
              </View>

              <View style={styles.itemContent}>
                  {/* Name and Badge */}
                  <View style={styles.titleRow}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{item.assigned_seekers_count || 0} Seekers</Text>
                    </View>
                  </View>
                  
                  {/* Phone Row */}
                  <View style={styles.detailRow}>
                      <Ionicons name="call-outline" size={14} color={SUBTLE_TEXT_COLOR} />
                      <Text style={styles.subtitle}>{item.mobile || 'No Mobile'}</Text>
                      <View style={styles.dotSeparator} />
                      <Text style={styles.subtitle}>Calling Team Member</Text>
                  </View>
                  
                  {/* New Info: Assigned Date (Optional if available) */}
                  {/* <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="account-check-outline" size={14} color={PRIMARY_COLOR} />
                    <Text style={styles.activeText}>Active Caller</Text>
                  </View> */}
              </View>
              
              <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
                <Ionicons name="people-circle-outline" size={60} color={SUBTLE_TEXT_COLOR} />
                <Text style={styles.emptyText}>No team members found.</Text>
            </View>
          )}
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 12, paddingVertical: 12 },
  
  // --- New Modern Card Styles ---
  itemCard: {
    backgroundColor: ITEM_BACKGROUND,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: PRIMARY_COLOR, fontWeight: '700', fontSize: 16 },
  itemContent: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemTitle: { fontSize: 16, fontWeight: "700", color: TEXT_COLOR },
  
  countBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countText: { fontSize: 11, color: PRIMARY_COLOR, fontWeight: '700' },

  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  subtitle: { fontSize: 13, color: SUBTLE_TEXT_COLOR, marginLeft: 4 },
  dotSeparator: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#C7C7CC", marginHorizontal: 8 },
  
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  activeText: { fontSize: 12, color: PRIMARY_COLOR, marginLeft: 5, fontWeight: '500' },

  emptyContainer: { padding: 40, alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 10, fontSize: 16, color: SUBTLE_TEXT_COLOR }
});