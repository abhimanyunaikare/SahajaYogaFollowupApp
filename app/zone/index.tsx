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

// --- Constants for Styled Minimalist Design ---
const PRIMARY_COLOR = "#007AFF";
const TEXT_COLOR = "#212121";
const SUBTLE_TEXT_COLOR = "#757575";
const BACKGROUND_COLOR = "#F4F4F4"; // Light grey background
const ITEM_BACKGROUND = "#FFFFFF"; // Pure white card background

export default function ZoneScreen() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get("/zones");
        setRoles(response.data);
      } catch (error) {
        console.log("Error fetching zones:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color={PRIMARY_COLOR} />;
  }
  
  // Component to render when the list is empty
  const EmptyList = () => (
      <View style={styles.emptyContainer}>
          <Ionicons name="key-outline" size={40} color={SUBTLE_TEXT_COLOR} />
          <Text style={styles.emptyText}>No zones found. Tap '+' to create one.</Text>
      </View>
  );

  return (
     <>
      <Stack.Screen
        options={{
          title: "Zones List",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/zone/add")}
              style={styles.headerButton}
            >
              <Ionicons name="add-circle" size={26} color={PRIMARY_COLOR} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.container}>
        <FlatList
          data={roles}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemCard}
              onPress={() => router.push(`/zone/edit/${item.id}`)}
            >
              {/* Subtle color bar on the left */}
              <View style={styles.itemColorBar} /> 
              
              {/* Title and Detail Container */}
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemDetail}>ID: {item.id}</Text>
              </View>
              
              {/* Action Indicator */}
              <Ionicons name="chevron-forward-outline" size={20} color={SUBTLE_TEXT_COLOR} />
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
  loader: { 
      flex: 1, 
      justifyContent: 'center', 
      backgroundColor: BACKGROUND_COLOR 
    },
  headerButton: { 
      marginRight: Platform.OS === 'ios' ? -5 : 0 
    },
  container: { 
      flex: 1, 
      backgroundColor: BACKGROUND_COLOR 
    },
  listContent: {
      paddingHorizontal: 15,
      paddingTop: 15,
      paddingBottom: 100,
    },
  
  // 🌟 STYLED LIST ITEM (CARD)
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ITEM_BACKGROUND,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden', 
    // Subtle shadow for card lift, matching the screenshot's empty item look
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
  itemColorBar: {
    width: 5, 
    height: '100%',
    backgroundColor: PRIMARY_COLOR,
    marginRight: 15,
  },
  itemContent: {
      flex: 1,
      paddingVertical: 15,
      paddingRight: 10,
  },
  itemTitle: { 
      fontSize: 16, 
      fontWeight: "700", 
      color: TEXT_COLOR 
    },
  itemDetail: {
      fontSize: 12,
      color: SUBTLE_TEXT_COLOR,
      marginTop: 2,
  },
  
  // --- Empty State ---
  emptyContainer: {
      padding: 30, // Slightly less padding for a tighter feel
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ITEM_BACKGROUND,
      borderRadius: 8,
      marginHorizontal: 15,
      marginTop: 20,
      borderWidth: 1,
      borderColor: BACKGROUND_COLOR, 
      // Ensure the empty container also has the shadow to match the list items when empty
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
  emptyText: {
      marginTop: 10,
      fontSize: 16,
      color: SUBTLE_TEXT_COLOR,
      textAlign: 'center',
  }
});