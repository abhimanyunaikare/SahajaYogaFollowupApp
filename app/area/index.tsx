import React, { useEffect, useState, useCallback } from "react";
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator, 
    Platform,
    Alert,
    TextInput, // 🆕 Added TextInput for search
    Keyboard, // 🆕 Added Keyboard to dismiss it
} from "react-native";
import { useRouter , Stack} from "expo-router";
import api from "../../src/api/apiClient";
import { Ionicons } from "@expo/vector-icons";

// --- Constants for Styled Minimalist Design ---
const PRIMARY_COLOR = "#007AFF";
const TEXT_COLOR = "#212121";
const SUBTLE_TEXT_COLOR = "#757575";
const BACKGROUND_COLOR = "#F4F4F4"; 
const ITEM_BACKGROUND = "#FFFFFF"; 

export default function AreaScreen() {
  const [originalAreas, setOriginalAreas] = useState([]); // 🆕 Holds the full list
  const [areas, setAreas] = useState([]); // Holds the currently displayed (filtered) list
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); // 🆕 State for search input
  const router = useRouter();

  // --- Search Filtering Logic ---
  const handleSearch = useCallback((query) => {
    const formattedQuery = query.toLowerCase().trim();
    setSearchQuery(query);

    if (formattedQuery === '') {
      setAreas(originalAreas);
      return;
    }

    const filtered = originalAreas.filter(area => {
      // Search by Area Name
      const nameMatch = area.name.toLowerCase().includes(formattedQuery);
      
      // Search by Zone Name (optional)
      const zoneMatch = area.zone?.name?.toLowerCase().includes(formattedQuery);

      return nameMatch || zoneMatch;
    });

    setAreas(filtered);
  }, [originalAreas]);


  // --- Data Fetching ---
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await api.get("/areas");
        const data = response.data;
        
        setOriginalAreas(data); // Store the full list
        setAreas(data); // Initialize the displayed list
      } catch (error) {
        console.log("Error fetching areas:", error.message);
        Alert.alert("Error", "Failed to fetch area data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAreas();
  }, []);

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color={PRIMARY_COLOR} />;
  }
  
  // Component to render when the list is empty
  const EmptyList = () => (
      <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={40} color={SUBTLE_TEXT_COLOR} /> 
          <Text style={styles.emptyText}>
            {/* Display relevant message based on filter state */}
            {searchQuery ? `No areas found matching "${searchQuery}".` : "No areas found. Tap '+' to create one."}
          </Text>
      </View>
  );

  return (
     <>
      <Stack.Screen
        options={{
          title: "Area List", 
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/area/add")} 
              style={styles.headerButton}
            >
              <Ionicons name="add-circle" size={26} color={PRIMARY_COLOR} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.container}>
        
        {/* 🆕 Search Input Field */}
        <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={SUBTLE_TEXT_COLOR} style={styles.searchIcon} />
            <TextInput
                style={styles.searchInput}
                placeholder="Search by Area or Zone name..."
                placeholderTextColor={SUBTLE_TEXT_COLOR}
                value={searchQuery}
                onChangeText={handleSearch} // Triggers filter on every change
                onBlur={Keyboard.dismiss} // Dismiss keyboard when focus leaves
                clearButtonMode="while-editing" // iOS clear button
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color={SUBTLE_TEXT_COLOR} />
                </TouchableOpacity>
            )}
        </View>

        <FlatList
          data={areas} 
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemCard}
              onPress={() => router.push(`/area/edit/${item.id}`)} 
            >
              <View style={styles.itemColorBar} /> 
              
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemDetail}>Zone: {item.zone?.name || 'Unassigned'}</Text> 
              </View>
              
              <Ionicons name="chevron-forward-outline" size={20} color={SUBTLE_TEXT_COLOR} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={EmptyList}
          // Added paddingTop to listContent to separate it from the search bar
          contentContainerStyle={{ ...styles.listContent, paddingTop: 5 }} 
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // ... (Existing styles remain the same) ...
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
      backgroundColor: BACKGROUND_COLOR,
      paddingHorizontal: 15, // Move horizontal padding up to the container
    },
  listContent: {
      // paddingHorizontal removed from here
      paddingTop: 15, 
      paddingBottom: 100, 
    },
  
  // 🆕 SEARCH BAR STYLES
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ITEM_BACKGROUND,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 10,
    ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
        android: { elevation: 1.5 },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: TEXT_COLOR,
  },
  clearButton: {
    padding: 5,
  },
  
  // 🌟 STYLED LIST ITEM (CARD)
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ITEM_BACKGROUND,
    borderRadius: 8,
    marginBottom: 10,
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
      padding: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ITEM_BACKGROUND,
      borderRadius: 8,
      marginTop: 20,
      borderWidth: 1,
      borderColor: BACKGROUND_COLOR, 
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