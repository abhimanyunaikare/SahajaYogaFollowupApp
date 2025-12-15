import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
    View, 
    Text, 
    TouchableOpacity, 
    FlatList, 
    StyleSheet, 
    RefreshControl, 
    TextInput, 
    ActivityIndicator, // Added ActivityIndicator for loading spinner
    Platform 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import api from "../../src/api/apiClient";

// --- Constants for Minimalist Design ---
const PRIMARY_COLOR = "#007AFF";
const TEXT_COLOR = "#212121";
const SUBTLE_TEXT_COLOR = "#757575";
const BACKGROUND_COLOR = "#F4F4F4"; // Light grey background
const ITEM_BACKGROUND = "#FFFFFF"; // Pure white card background

export default function UsersListScreen() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true); // State for initial screen load
  const [searchQuery, setSearchQuery] = useState(''); 

  // --- API CALL FUNCTION ---
  const fetchUsers = useCallback(async () => {
    setRefreshing(true); 
    // Only show the full screen spinner on initial load (if list is empty)
    if (users.length === 0) setLoading(true); 

    try {
      const response = await api.get("/users");
      setUsers(response.data); 

    } catch (error) {
      console.error("Error fetching users:", error.response?.data || error.message);
    } finally {
      setLoading(false); 
      setRefreshing(false);
    }
  }, [users.length]); // Dependency added for initial loading check

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // 3. Filtering Logic using useMemo for performance
  const filteredUsers = useMemo(() => {
    if (!searchQuery) {
      return users;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    
    return users.filter(user => 
      // Filter by user name (case insensitive)
      user.name && user.name.toLowerCase().includes(lowerCaseQuery)
      // You can add more fields here (e.g., user.role.name, user.mobile) if needed for search
    );
  }, [users, searchQuery]);

  // Component for list item rendering
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/users/edit/${item.id}`)} 
    >
      {/* Subtle color bar on the left */}
      <View style={styles.itemColorBar} />

      <View style={styles.cardContent}>
        {/* User Icon */}
        <Ionicons name="person-circle-outline" size={36} color={PRIMARY_COLOR} style={styles.userIcon} />
        
        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.role}>{item.role.name}</Text>
          <Text style={styles.zone}>
            <Ionicons name="location-outline" size={12} color={SUBTLE_TEXT_COLOR} /> 
            {' '}{item.zone?.name || 'N/A'}
          </Text>
        </View>
        
        {/* Action Icon (Chevron Forward) */}
        <Ionicons name="chevron-forward-outline" size={20} color={SUBTLE_TEXT_COLOR} />
      </View>
    </TouchableOpacity>
  );

  // 💡 Render a full-screen spinner during the initial load
  if (loading) {
      return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND_COLOR }}>
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          </View>
      );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Users List",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/users/add")}
              style={styles.headerButton}
            >
              <Ionicons name="add-circle" size={26} color={PRIMARY_COLOR} />
            </TouchableOpacity>
          ),
        }}
      />
    <View style={styles.container}>
      
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={SUBTLE_TEXT_COLOR} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Name..."
          placeholderTextColor={SUBTLE_TEXT_COLOR}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={SUBTLE_TEXT_COLOR} />
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={fetchUsers} 
            tintColor={PRIMARY_COLOR}
          />
        }
        ListEmptyComponent={
          // Show empty component only if not refreshing/loading
          !refreshing && !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={40} color={SUBTLE_TEXT_COLOR} />
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? `No users found matching "${searchQuery}"` 
                  : "No users to display."
                }
              </Text>
            </View>
          )
        }
      />
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: BACKGROUND_COLOR,
  },
  listContent: {
    paddingHorizontal: 15, 
    paddingBottom: 20,
  },
  headerButton: { 
      marginRight: Platform.OS === 'ios' ? -5 : 0 
  },
  
  // --- Search Bar Styles ---
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ITEM_BACKGROUND,
    borderRadius: 8,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 16,
    color: TEXT_COLOR,
  },
  clearButton: {
    padding: 5,
  },
  
  // --- Optimized Card Styles ---
  card: {
    backgroundColor: ITEM_BACKGROUND,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
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
  },
  cardContent: { 
    flexDirection: "row", 
    alignItems: "center",
    flex: 1,
    paddingVertical: 12, 
    paddingHorizontal: 15, 
  },
  userIcon: {
    marginRight: 10,
    opacity: 0.8,
  },
  userInfo: { 
    flex: 1, 
    marginRight: 15, 
  },
  name: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: TEXT_COLOR 
  },
  role: { 
    color: PRIMARY_COLOR, 
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  zone: { 
    color: SUBTLE_TEXT_COLOR, 
    fontSize: 12, 
    marginTop: 3, 
  },
  
  // --- Empty State Styles ---
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ITEM_BACKGROUND,
    borderRadius: 8,
    marginTop: 20,
    marginHorizontal: 15,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: SUBTLE_TEXT_COLOR,
    textAlign: 'center',
  }
});