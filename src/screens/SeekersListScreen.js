import React, { useEffect, useState, useContext, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Button,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/apiClient";
import { AuthContext } from "../../src/context/AuthContext";
import { useRouter, Stack } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';

// --- Constants for Consistent Styling ---
const PRIMARY_COLOR = "#007AFF"; 
const SUCCESS_COLOR = "#4CAF50"; 
const DANGER_COLOR = "#F44336"; 
const BACKGROUND_COLOR = "#F9F9F9";
const CARD_BACKGROUND = "#FFFFFF";
const DEBOUNCE_DELAY = 500; // 500ms delay for search

// Utility for Debouncing
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// Optimized Filter Option Component (No change)
const FilterOption = ({ label, isSelected, onPress }) => (
  <TouchableOpacity
    style={[
      styles.filterOption,
      isSelected ? styles.selectedOption : styles.unselectedOption,
    ]}
    onPress={onPress}
  >
    <Text style={[styles.filterOptionText, isSelected && styles.selectedOptionText]}>{label}</Text>
  </TouchableOpacity>
);

// Optimized Seeker Card Component (No change)
const SeekerCard = React.memo(({ item, isSelected, onToggleSelection, onViewDetails }) => {
    const moderatorIconColor = item.moderator ? SUCCESS_COLOR : DANGER_COLOR;
    const moderatorIconName = item.moderator ? "person" : "person-remove"; 

    return (
        <TouchableOpacity
            style={[styles.card, isSelected && styles.selectedCard]}
            activeOpacity={0.8}
            onPress={onViewDetails}
        >
            <View style={styles.cardContent}>
                <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={onToggleSelection}
                >
                    <Ionicons
                        name={isSelected ? "checkbox-outline" : "square-outline"}
                        size={22} 
                        color={isSelected ? PRIMARY_COLOR : "#A0A0A0"}
                    />
                </TouchableOpacity>
        
                <View style={styles.infoContainer}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name} numberOfLines={1}>
                            {item.first_name} {item.last_name}
                        </Text>
                        <Ionicons name={moderatorIconName} size={18} color={moderatorIconColor} style={{marginLeft: 8}} />
                    </View>
                    
                    <View style={styles.detailsRow}>
                        <Ionicons name="location-outline" size={12} color="#6B7280" style={{marginRight: 2}} />
                        <Text style={styles.locationText} numberOfLines={1}>{item.zone?.name}, {item.city || "N/A"}</Text>
                        
                        <Ionicons name="call-outline" size={12} color="#6B7280" style={{marginLeft: 12, marginRight: 2}} />
                        <Text style={styles.mobileText}>{item.mobile}</Text>
                    </View>
                    
                    <View style={styles.typeBadgeContainer}>
                        <Text style={styles.typeBadgeText}>
                            {item.type === 1 ? 'Pratishthan Seeker' : 'Public Seeker'}
                        </Text>
                    </View>

                </View>
            </View>
        </TouchableOpacity>
    );
});


export default function SeekersListScreen() {
  const [seekers, setSeekers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedSeekers, setSelectedSeekers] = useState([]);
  const [moderatorModalVisible, setModeratorModalVisible] = useState(false);
  const [moderators, setModerators] = useState([]);
  const [selectedModerator, setSelectedModerator] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentFilters, setCurrentFilters] = useState({});
  const [activeTypeTab, setActiveTypeTab] = useState("all");
  const [zones, setZones] = useState([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  
  const { user } = useContext(AuthContext);
  const role = Number(user.role_id);
  const isDisabled = !(role === 2 || role === 3);

  const modalTitle = role === 2 ? "Caller" : role === 3 ? "Moderator" : "Not Allowed";
                      
  const getButtonLabel = () => {
    if (role === 2) return `Assign Caller (${selectedSeekers.length})`;
    if (role === 3) return `Assign Moderator (${selectedSeekers.length})`;
    return "Not Allowed";
  };
  
  const [filters, setFilters] = useState({
    name: "",
    mobile: "",
    zone_id: "",
    type: "",
    interested_in_followup: null,
    moderator_id: null,
    attended_puja: null,
    attended_centres: null,
    attended_session_1: null,
    attended_session_2: null,
    attended_session_3: null,
    attended_session_4: null,
  });

  // 🛠️ NEW: Debounce the 'name' filter input
  const debouncedSearchTerm = useDebounce(filters.name, DEBOUNCE_DELAY);

  const fetchSeekers = async (filters = {}, pageNumber = 1, refreshing = false) => {
    if (loading && !refreshing && pageNumber !== 1) return;
  
    try {
      // Show loading indicator only when refreshing or initially loading page 1
      if (pageNumber === 1 && !refreshing) setInitialLoading(true);
      setLoading(true);
  
      const defaultContextParams = {
        zone_id: user.zone_id,
        role_id: role,
        id: user.id,
      };

      const finalFilters = { ...filters, ...defaultContextParams };
  
      const queryParams = Object.entries(finalFilters)
        .filter(([_, value]) => value !== "" && value !== null)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join("&");
  
      const url = `/seekers?${queryParams}&page=${pageNumber}`;
  
      const response = await api.get(url);
      const data = response.data.data || [];
      const isLastPage = response.data.current_page >= response.data.last_page;
  
      setSeekers((prev) => 
        refreshing || pageNumber === 1 ? data : [...prev, ...data]
      );
  
      setHasMore(!isLastPage);
      setPage(pageNumber);
      setCurrentFilters(filters); 
    } catch (error) {
      console.error("Error fetching seekers:", error.message);
    } finally {
      setLoading(false);
      setInitialLoading(false);
      setRefreshing(false);
    }
  };
  
  // 🚀 FIX: Trigger search only when the debounced term changes
  useEffect(() => {
    // Only search if the component is not in its initial loading phase
    if (!initialLoading) {
      // Ensure we merge the debounced name with the other active filters
      const newFilters = { 
        ...currentFilters, 
        name: debouncedSearchTerm, 
        type: activeTypeTab === 'all' ? '' : activeTypeTab // Ensure the current tab is respected
      };
      
      // Update current filters to include the latest search term
      setCurrentFilters(newFilters);
      
      // Fetch seekers with the new filters starting from page 1
      fetchSeekers(newFilters, 1, true); 
    }
  }, [debouncedSearchTerm]); // Dependency on the debounced value

  
  useFocusEffect(
    useCallback(() => {
        // Only run if we are not currently loading for the first time
        if (!initialLoading) {
            // Re-fetch using the current active filters
            fetchSeekers(currentFilters, 1, true);
        } else {
            // Initial load sequence
            fetchSeekers(currentFilters, 1, true);
        }
    }, [user.id, user.zone_id, role, currentFilters])
  );
  
  // Initial zones fetch
  useEffect(() => {
    const fetchZones = async () => {
        try {
            const response = await api.get("/zones");
            setZones(response.data);
        } catch (error) {
            console.error("Error loading zones:", error);
        }
    };
    fetchZones();
  }, []);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchSeekers(currentFilters, page + 1);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchSeekers(currentFilters, 1, true);
  };
  
  // 🛠️ Updated: Now only updates the local state 'filters.name'. The debounced effect handles the API call.
  const handleSearchChange = (text) => {
    setFilters(prev => ({ ...prev, name: text }));
  };

  const handleApplyFilters = () => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== "" && v !== null)
    );
    setFilterVisible(false);
    
    // Set active tab based on filter result
    if (params.type) {
        setActiveTypeTab(params.type);
    } else {
        setActiveTypeTab("all");
    }
    
    // Apply filters and search term together
    const combinedFilters = {
        ...params,
        name: filters.name, // Use the current filter's name (which might not be debounced yet)
    };

    fetchSeekers(combinedFilters, 1, true);
  };

  const handleReset = () => {
    const resetFilters = {
      name: "",
      mobile: "",
      zone_id: "",
      type: "",
      interested_in_followup: null,
      moderator_id: null,
      attended_puja: null,
      attended_centres: null,
      attended_session_1: null,
      attended_session_2: null,
      attended_session_3: null,
      attended_session_4: null,
    };
    setFilters(resetFilters);
    setActiveTypeTab("all");
    setIsSearchVisible(false); 
    fetchSeekers(resetFilters, 1, true); 
  };

  const toggleSelection = (id) => {
    setSelectedSeekers((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };
  
  const renderItem = ({ item }) => (
    <SeekerCard 
        item={item}
        isSelected={selectedSeekers.includes(item.id)}
        onToggleSelection={() => toggleSelection(item.id)}
        onViewDetails={() => router.push(`/seeker/${item.id}`)}
    />
  );
  
  const fetchModerators = async () => {
    try {
      const url = `/users?user_type=seeker&role_id=${role}`;
      const response = await api.get(url);
      setModerators(response.data);
    } catch (error) {
      console.error("Error fetching moderators:", error);
    }
  };
  
  const assignModerator = async () => {
    if (!selectedModerator) return Alert.alert("Please select a caller/moderator");
  
    try {
      await api.post("/seekers/assign-moderator", {
        moderator_id: selectedModerator,
        seeker_ids: selectedSeekers,
        role: role, 
      });
      Alert.alert("Success", `${modalTitle} assigned successfully!`);
      setModeratorModalVisible(false);
      setSelectedSeekers([]);
      fetchSeekers(currentFilters, 1, true); // Refresh list
    } catch (error) {
      console.error("Error assigning moderator:", error);
      Alert.alert("Error", "Could not assign caller/moderator.");
    }
  };
  

  if (initialLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={{ marginTop: 10, color: "#555", fontSize: 16 }}>Loading data...</Text>
      </View>
    );
  }
  
  // Define the custom Home button component
  const renderHomeButton = () => (
      <TouchableOpacity
          style={styles.homeButton}
          // Use router.replace to go to the Home screen and clear the stack history
          onPress={() => router.replace('/')} // Change '/' to your actual home path (e.g., '/home')
      >
          <Ionicons name="home-outline" size={24} color="#1F2937" />
      </TouchableOpacity>
  );

  const renderHeaderRight = () => (
    <View style={styles.headerRightContainer}>
        <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => {
                setIsSearchVisible(prev => !prev);
                // Clear search input if hiding
                if (isSearchVisible) {
                    handleSearchChange(''); 
                }
            }} 
        >
            <Ionicons name={isSearchVisible ? "close" : "search"} size={24} color="#1F2937" />
        </TouchableOpacity>
        <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterVisible(true)}
        >
            <Ionicons name="filter" size={18} color="#fff" />
            <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Seekers List",
          headerRight: renderHeaderRight,
          headerLeft: renderHomeButton,
          headerStyle: { backgroundColor: CARD_BACKGROUND }, 
          headerTitleStyle: { color: "#1F2937" },
        }}
      />

    <SafeAreaView style={styles.container}>
     
      {isSearchVisible && (
          <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                  style={styles.searchInput}
                  placeholder="Search Name or Mobile..."
                  placeholderTextColor="#A0A0A0"
                  value={filters.name} 
                  onChangeText={handleSearchChange}
                  // Removed onSubmitEditing as debounce handles search now
              />
              {filters.name.length > 0 && (
                <TouchableOpacity 
                  onPress={() => {
                      handleSearchChange(''); // Clear search input
                  }}
                  style={{padding: 5}}
                >
                  <Ionicons name="close-circle" size={20} color="#A0A0A0" />
                </TouchableOpacity>
              )}
          </View>
      )}


      {/* Tabs for Type Filtering (More compact design) */}
      <View style={styles.tabsContainer}>
        {[
          { label: "All", value: "all" },
          { label: "Pratishthan", value: "1" },
          { label: "Public", value: "2" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeTypeTab === tab.value && styles.activeTab]}
            onPress={() => {
              setActiveTypeTab(tab.value);
              const newFilters = {
                ...currentFilters, 
                type: tab.value === "all" ? "" : tab.value,
                name: filters.name, // Preserve current search term
              };
              setCurrentFilters(newFilters);
              fetchSeekers(newFilters, 1, true);
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTypeTab === tab.value && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={seekers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={PRIMARY_COLOR} />
        }
        ListFooterComponent={
          loading && !refreshing && page > 1 ? (
            <ActivityIndicator size="small" color={PRIMARY_COLOR} style={{ padding: 10 }} />
          ) : null
        }
        // 🚀 FIX: Increased bottom padding significantly to clear the bottom navigation area and floating button
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: selectedSeekers.length > 0 ? 150 : 50 }}
        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>No seekers found matching your criteria.</Text>
        }
      />

      {selectedSeekers.length > 0 && (
        <TouchableOpacity
          style={[
            styles.assignButton,
            isDisabled && styles.assignButtonDisabled
          ]}
          disabled={isDisabled}
          onPress={() => {
            if (!isDisabled) {
              fetchModerators();
              setSelectedModerator(null); 
              setModeratorModalVisible(true);
            }
          }}
        >
          <Text
            style={styles.assignButtonText}
          >
            {getButtonLabel()}
          </Text>
        </TouchableOpacity>
      )}

      {/* 🪟 Filter Modal */}
      <Modal visible={filterVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter Seekers</Text>
                <TouchableOpacity
                    onPress={() => setFilterVisible(false)}
                    style={styles.closeButton}
                >
                    <Ionicons name="close" size={24} color="#555" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{paddingBottom: 20}}>

              <Text style={styles.sectionTitle}>General Details</Text>

              {/* Mobile Input */}
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                placeholderTextColor="#A0A0A0"
                keyboardType="phone-pad"
                value={filters.mobile}
                onChangeText={(text) => setFilters({ ...filters, mobile: text })}
              />
              
              {/* Zone Picker */}
              <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={filters.zone_id}
                    onValueChange={(value) => setFilters({ ...filters, zone_id: value })}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    <Picker.Item label="Select Zone" value="" color="#A0A0A0" />
                    {zones.map((zone) => (
                      <Picker.Item key={zone.id} label={zone.name} value={zone.id} />
                    ))}
                  </Picker>
              </View>

              {/* Type Picker */}
              <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={filters.type}
                    onValueChange={(value) => setFilters({ ...filters, type: value })}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    <Picker.Item label="Select Type" value="" color="#A0A0A0" />
                    <Picker.Item label="Pratishthan" value="1" />
                    <Picker.Item label="Public" value="2" />
                  </Picker>
              </View>

              <Text style={styles.sectionTitle}>Follow-up Status</Text>
              
              {/* Interested in Follow-up */}
              <View style={styles.optionGroup}>
                <Text style={styles.optionGroupLabel}>Interested in Follow-up</Text>
                <View style={styles.optionRow}>
                    <FilterOption label="Yes" isSelected={filters.interested_in_followup === true} onPress={() => setFilters({ ...filters, interested_in_followup: true })} />
                    <FilterOption label="No" isSelected={filters.interested_in_followup === false} onPress={() => setFilters({ ...filters, interested_in_followup: false })} />
                    <FilterOption label="All" isSelected={filters.interested_in_followup === null} onPress={() => setFilters({ ...filters, interested_in_followup: null })} />
                </View>
              </View>
              
              {/* Moderator Assigned */}
              <View style={styles.optionGroup}>
                <Text style={styles.optionGroupLabel}>Moderator Assigned</Text>
                <View style={styles.optionRow}>
                    <FilterOption label="Yes" isSelected={filters.moderator_id === true} onPress={() => setFilters({ ...filters, moderator_id: true })} />
                    <FilterOption label="No" isSelected={filters.moderator_id === false} onPress={() => setFilters({ ...filters, moderator_id: false })} />
                    <FilterOption label="All" isSelected={filters.moderator_id === null} onPress={() => setFilters({ ...filters, moderator_id: null })} />
                </View>
              </View>


              <Text style={styles.sectionTitle}>Activity Checklist</Text>

              {/* Attended Puja */}
              <View style={styles.optionGroup}>
                <Text style={styles.optionGroupLabel}>Attended Puja</Text>
                <View style={styles.optionRow}>
                    <FilterOption label="Yes" isSelected={filters.attended_puja === true} onPress={() => setFilters({ ...filters, attended_puja: true })} />
                    <FilterOption label="No" isSelected={filters.attended_puja === false} onPress={() => setFilters({ ...filters, attended_puja: false })} />
                    <FilterOption label="All" isSelected={filters.attended_puja === null} onPress={() => setFilters({ ...filters, attended_puja: null })} />
                </View>
              </View>

              {/* Attended Centre */}
              <View style={styles.optionGroup}>
                <Text style={styles.optionGroupLabel}>Attended Centre</Text>
                <View style={styles.optionRow}>
                    <FilterOption label="Yes" isSelected={filters.attended_centres === true} onPress={() => setFilters({ ...filters, attended_centres: true })} />
                    <FilterOption label="No" isSelected={filters.attended_centres === false} onPress={() => setFilters({ ...filters, attended_centres: false })} />
                    <FilterOption label="All" isSelected={filters.attended_centres === null} onPress={() => setFilters({ ...filters, attended_centres: null })} />
                </View>
              </View>

              {/* Pratishthan Sessions (1st to 4th) */}
              {[1, 2, 3, 4].map((n) => (
                <View key={`session-${n}`} style={styles.optionGroup}>
                    <Text style={styles.optionGroupLabel}>{`Attended ${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'} Session`}</Text>
                    <View style={styles.optionRow}>
                        <FilterOption label="Yes" isSelected={filters[`attended_session_${n}`] === true} onPress={() => setFilters({ ...filters, [`attended_session_${n}`]: true })} />
                        <FilterOption label="No" isSelected={filters[`attended_session_${n}`] === false} onPress={() => setFilters({ ...filters, [`attended_session_${n}`]: false })} />
                        <FilterOption label="All" isSelected={filters[`attended_session_${n}`] === null} onPress={() => setFilters({ ...filters, [`attended_session_${n}`]: null })} />
                    </View>
                </View>
              ))}

            </ScrollView>

            <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                    <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
                    <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* 🪟 Moderator/Caller Assignment Modal */}
      <Modal visible={moderatorModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.moderatorModalContent}>
                <Text style={styles.modalTitle}>{`Select ${modalTitle}`}</Text>

                <ScrollView style={{maxHeight: 300, marginVertical: 15}}>
                    {moderators.map((mod) => (
                    <TouchableOpacity
                        key={mod.id}
                        style={[
                        styles.moderatorItem,
                        mod.id === selectedModerator && styles.selectedModerator,
                        ]}
                        onPress={() => setSelectedModerator(mod.id)}
                    >
                        <Text style={styles.moderatorName}>{mod.name}</Text>
                        <Text style={styles.moderatorZone}>{mod.zone?.name || 'Global'}</Text>
                    </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.modalButtons}>
                    <Button title="Cancel" color="gray" onPress={() => setModeratorModalVisible(false)} />
                    <Button title={`Assign ${selectedSeekers.length} Seeker(s)`} onPress={assignModerator} disabled={!selectedModerator} />
                </View>
            </View>
        </View>
      </Modal>

    </SafeAreaView>

    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR,  },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BACKGROUND_COLOR },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6B7280',
  },

  // --- Header Right and Search Toggle ---
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: -10, 
  },
  headerIcon: {
    padding: 10,
    marginRight: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  filterText: {
    color: "#fff",
    marginLeft: 5,
    fontWeight: "600",
    fontSize: 14,
  },
  
  // --- Search Bar (Conditional) ---
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    marginTop: 0, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 8 : 8, 
    paddingBottom: Platform.OS === 'ios' ? 8 : 8, 
    fontSize: 15,
    color: '#1F2937',
  },

  // --- Tabs ---
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#E0F7FA", 
    borderRadius: 8,
    padding: 2, 
  },
  tab: {
    flex: 1,
    paddingVertical: 6, 
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: CARD_BACKGROUND,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  tabText: {
    fontSize: 13, 
    fontWeight: "500",
    color: "#00BCD4", 
  },
  activeTabText: {
    color: PRIMARY_COLOR, 
    fontWeight: "700",
  },

  // --- List Item Card (Density Optimized) ---
  card: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 12,
    marginHorizontal: 5,
    marginVertical: 4, 
    padding: 12, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: "#EBF5FF", 
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    elevation: 4,
  },
  cardContent: { 
    flexDirection: "row", 
    alignItems: "flex-start", 
  },
  checkboxContainer: {
    paddingRight: 10, 
    paddingVertical: 2,
  },
  infoContainer: {
    flex: 1, 
    marginLeft: 5 
  },
  nameRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    marginBottom: 2,
  },
  name: { 
    fontSize: 15, 
    fontWeight: "700", 
    color: "#1F2937" ,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2, 
  },
  locationText: { 
    fontSize: 13, 
    color: "#4B5563", 
  },
  mobileText: {
    fontSize: 13, 
    color: "#4B5563",
  },
  typeBadgeContainer: {
    marginTop: 4, 
    alignSelf: 'flex-start',
    backgroundColor: '#F0F9FF', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C5E0FF',
  },
  typeBadgeText: {
    fontSize: 11, 
    fontWeight: '600',
    color: '#1E40AF', 
  },

  // --- Assignment Button (Bottom Fix applied here too) ---
  assignButton: {
    position: "absolute",
    bottom: Platform.OS === 'ios' ? 20 : 35, // Increased bottom margin for Android safe area/nav bar
    left: 10,
    right: 10,
    backgroundColor: PRIMARY_COLOR,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  assignButtonDisabled: {
    backgroundColor: "#A0A0A0",
  },
  assignButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  // --- Modal Styles (Maintained Structure) ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end", 
  },
  modalContent: {
    width: "100%",
    maxHeight: "90%",
    backgroundColor: CARD_BACKGROUND,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#1F2937" 
  },
  closeButton: {
    padding: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
    color: PRIMARY_COLOR,
    borderBottomWidth: 1,
    borderBottomColor: "#D1E3FF",
    paddingBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 15,
    backgroundColor: '#F9FAFB',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  picker: { 
    height: 55, 
    width: '100%',
  },
  pickerItem: {
    fontSize: 15,
  },
  optionGroup: {
    marginBottom: 15,
  },
  optionGroupLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  unselectedOption: {
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
  },
  selectedOption: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  filterOptionText: {
    color: "#374151",
    fontWeight: "500",
  },
  selectedOptionText: {
    color: "#fff",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  resetButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    width: '35%',
    alignItems: 'center',
  },
  resetButtonText: {
    color: "#4B5563",
    fontWeight: '700',
  },
  applyButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: SUCCESS_COLOR,
    width: '60%',
    alignItems: 'center',
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: '700',
  },
  moderatorModalContent: {
    width: "90%",
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 12,
    padding: 20,
    alignSelf: 'center',
    elevation: 10,
  },
  moderatorItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedModerator: {
    backgroundColor: "#EBF5FF",
    borderRadius: 8,
  },
  moderatorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  moderatorZone: {
    fontSize: 13,
    color: '#6B7280',
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  homeButton: {
    marginLeft: 10, // Adjust spacing from the screen edge
    padding: 5,     // Make the touch target slightly larger
    paddingRight: 20,
},
});