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
import api from "../../src/api/apiClient"; 
import { Ionicons } from "@expo/vector-icons";

// --- Constants for Minimalist Card Design ---
const PRIMARY_COLOR = "#007AFF"; // Blue
const TEXT_COLOR = "#212121";
const SUBTLE_TEXT_COLOR = "#757575";
const BACKGROUND_COLOR = "#F4F4F4"; // Light grey screen background
const ITEM_BACKGROUND = "#FFFFFF"; // Pure white card background

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
    return <ActivityIndicator style={styles.loader} size="large" color={PRIMARY_COLOR} />;
  }
  
  // Component to display when the list is empty
  const EmptyList = () => (
    <View style={styles.emptyContainer}>
        <Ionicons name="people-circle-outline" size={40} color={SUBTLE_TEXT_COLOR} />
        <Text style={styles.emptyText}>No team members found.</Text>
    </View>
  );

  return (
     <>
      <Stack.Screen
        options={{
          title: "Calling Team Members",
          // The title is concise and clear
        }}
      />
        <View style={styles.container}>
          <FlatList
            data={members}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.itemCard}
                onPress={() => handleMemberPress(item.id, item.name)}
              >
                {/* 📞 Member Icon */}
                <Ionicons 
                    name="person-circle-outline" 
                    size={36} 
                    color={PRIMARY_COLOR} 
                    style={styles.memberIcon} 
                />

                <View style={styles.itemContent}>
                    {/* Name (Most Prominent) */}
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    
                    {/* Phone Number with Icon */}
                    <View style={styles.detailRow}>
                        <Ionicons name="call-outline" size={14} color={SUBTLE_TEXT_COLOR} />
                        <Text style={styles.itemSubtitle}>{item.phone || 'N/A'}</Text>
                    </View>
                    
                    {/* Assigned Seekers (Highlighted) */}
                    <View style={styles.detailRow}>
                        <Ionicons name="people-outline" size={14} color={PRIMARY_COLOR} />
                        <Text style={styles.countText}>
                            {item.seekers_count || 0} Assigned Seekers
                        </Text>
                    </View>
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
    // Subtle shadow for lift
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
  memberIcon: {
    marginRight: 15,
    opacity: 0.8,
  },
  itemContent: {
      flex: 1,
  },
  itemTitle: { 
      fontSize: 16, 
      fontWeight: "700", 
      color: TEXT_COLOR,
      marginBottom: 5,
    },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  itemSubtitle: { 
      fontSize: 14, 
      color: SUBTLE_TEXT_COLOR, 
      marginLeft: 5,
    },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY_COLOR, 
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