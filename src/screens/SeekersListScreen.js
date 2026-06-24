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
import DateTimePicker from '@react-native-community/datetimepicker';
import WhatsAppModal from "../components/WhatsAppModal";

// --- Constants for Consistent Styling ---
const PRIMARY_COLOR = "#007AFF"; 
const SUCCESS_COLOR = "#4CAF50"; 
const DANGER_COLOR = "#F44336"; 
const WARNING_COLOR = "#f49836"; 
const BACKGROUND_COLOR = "#F9F9F9";
const CARD_BACKGROUND = "#FFFFFF";
const DEBOUNCE_DELAY = 500;

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

// Helper function for date formatting
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
  });
};

const getStatusBadge = (item) => {
  if (item.interested_in_followup === false) {
    return { label: 'Not Interested', bg: '#FCEBEB', border: '#F09595', text: '#791F1F' };
  }
  if (item.moderator) {
    return { label: 'Mentor Assigned', bg: '#EEEDFE', border: '#AFA9EC', text: '#3C3489' };
  }
  if (item.called === true) {
    return { label: 'Seeker Called', bg: '#E1F5EE', border: '#5DCAA5', text: '#085041' };
  }
  if (item.caller) {
    return { label: 'Caller Assigned', bg: '#E6F1FB', border: '#85B7EB', text: '#0C447C' };
  }
  return { label: 'New Seeker', bg: '#FAEEDA', border: '#EF9F27', text: '#633806' };
};

// ── UNCHANGED: SeekerCard ────────────────────────────────────────────────────
const SeekerCard = React.memo(({ item, isSelected, onToggleSelection, onViewDetails }) => {
    const moderatorIconColor = item.moderator ? SUCCESS_COLOR : DANGER_COLOR;
    const moderatorIconName = item.moderator ? "person-outline" : "person-remove-outline"; 
    const callerIconColor = item.caller ? SUCCESS_COLOR : WARNING_COLOR;
    const callerIconName = item.caller ? "mic-outline" : "mic-off-outline"; 

    const checklist = item.checklist || {};

    const renderProgressDots = (prefix, activeColor) => {
      return (
          <View style={styles.dotGroup}>
              {[1, 2, 3, 4].map((num) => {
                  const isAttended = checklist[`${prefix}_${num}`] === true || checklist[`${prefix}_${num}`] === 1;
                  return (
                      <View 
                          key={`${prefix}-${num}`} 
                          style={[
                              styles.miniDot, 
                              { backgroundColor: isAttended ? activeColor : '#E5E7EB' }
                          ]}
                      >
                          <Text style={[styles.dotText, { color: isAttended ? '#fff' : '#9CA3AF' }]}>
                              {num}
                          </Text>
                      </View>
                  );
              })}
          </View>
      );
    };
  
    const hasCallAttempt = item.called === true;
    
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
                          {(() => {
                              const status = getStatusBadge(item);
                              return (
                                  <View style={[
                                      styles.typeBadgeStatusContainer,
                                      { backgroundColor: status.bg, borderColor: status.border, padding: 2 }
                                  ]}>
                                      <Text style={[styles.typeBadgeStatusText, { color: status.text, fontSize:11 }]}>
                                          {status.label}
                                      </Text>
                                  </View>
                              );
                          })()}
                      </View>
                      
                      <View style={styles.detailsRow}>
                          <Ionicons name="location-outline" size={12} color="#6B7280" style={{marginRight: 2}} />
                          <Text style={styles.locationText} numberOfLines={1}>{item.zone?.name}, {item.city || "N/A"}</Text>
                          <Ionicons name="call-outline" size={12} color="#6B7280" style={{marginLeft: 12, marginRight: 2}} />
                          <Text style={styles.mobileText}>{item.mobile}</Text>
                      </View>

                      <View style={styles.detailsRow}>
                          <Ionicons name="calendar-number-outline" size={12} color="#6B7280" style={{marginRight: 2}} />
                          <Text style={styles.locationText} numberOfLines={1}>{formatDate(item.created_at)}</Text>                        
                          <Ionicons name="today-outline" size={12} color="#6B7280" style={{marginLeft: 12, marginRight: 2}} />
                          <Text style={styles.mobileText}>{formatDate(item.updated_at)}</Text>
                      </View>
                      
                      <View style={styles.bottomBadgeContainer}>
                          <View style={styles.typeBadgeContainer}>
                              <Text style={styles.typeBadgeText}>
                                  {item.type === 1 ? 'Pratishthan Seeker' : 'PP Seeker'}
                              </Text>
                          </View>

                          <View style={styles.progressSection}>
                            <View style={styles.indicatorWrapper}>
                                <Text style={styles.indicatorLabel}>S:</Text>
                                {renderProgressDots('attended_session', PRIMARY_COLOR)}
                            </View>
                            <View style={[styles.indicatorWrapper, { marginLeft: 10 }]}>
                                <Text style={styles.indicatorLabel}>M:</Text>
                                {renderProgressDots('month', SUCCESS_COLOR)}
                            </View>
                        </View>
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
  const [showPicker, setShowPicker] = useState(false);
  const [currentMode, setCurrentMode] = useState('from_date');
  const [whatsappModalVisible, setWhatsappModalVisible] = useState(false);

  const { user } = useContext(AuthContext);
  const role = user?.role_id ? Number(user.role_id) : null;
  const zoneid = user?.zone_id ? Number(user.zone_id) : null;
  const isDisabled = !(role === 2 || role === 3 || role === 10);

  const modalTitle = role === 2 ? "Caller" : role === 3 ? "Mentor" : role === 10 ? "Pratishthan Caller" : "Not Allowed";
          
  const showDatePicker = (mode) => {
      setCurrentMode(mode);
      setShowPicker(true);
  };

  const onDateChange = (event, selectedDate) => {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const formattedDate = `${year}-${month}-${day}`;
          setFilters({ ...filters, [currentMode]: formattedDate });
      }
  };

  const getPickerDate = () => {
    const dateString = filters[currentMode];
    if (dateString) return new Date(dateString);
    return new Date();
  };

  const getButtonLabel = () => {
    if (role === 2) return `Assign Caller (${selectedSeekers.length})`;
    if (role === 3) return `Assign Mentor (${selectedSeekers.length})`;
    if (role === 10) return `Assign Pratishthan Caller (${selectedSeekers.length})`;
    return "Not Allowed";
  };
  
  // Filters used by the Filter modal only (search-by-name lives separately, see searchName below)
  const [filters, setFilters] = useState({
    zone_id: "",
    type: "",
    attended_centres: null,
    attended_session_1: null,
    attended_session_2: null,
    attended_session_3: null,
    attended_session_4: null,
    from_date: "",
    to_date: "",
    month_1: null,
    month_2: null,
    month_3: null,
    month_4: null,
  });

  // Main-screen search bar (Name/Mobile) — independent of the Filter modal
  const [searchName, setSearchName] = useState("");
  const debouncedSearchTerm = useDebounce(searchName, DEBOUNCE_DELAY);

  // Count active filters for badge on Filter button
  const activeFilterCount = Object.values(filters).filter((v) => v !== "" && v !== null).length;

  const fetchSeekers = async (filters = {}, pageNumber = 1, refreshing = false) => {
    if (loading && !refreshing && pageNumber !== 1) return;
    try {
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
  
  // Debounced name search (main screen)
  useEffect(() => {
    if (!initialLoading) {
      const newFilters = { 
        ...currentFilters, 
        name: debouncedSearchTerm, 
        type: activeTypeTab === 'all' ? '' : activeTypeTab,
      };
      setCurrentFilters(newFilters);
      fetchSeekers(newFilters, 1, true); 
    }
  }, [debouncedSearchTerm]);

  useFocusEffect(
      useCallback(() => {
          if (!user?.id) return;
          fetchSeekers(currentFilters, 1, true);
      }, [user?.id, user?.zone_id, role, currentFilters]) 
  );
  
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
  
  // Search bar handler — uses separate searchName state
  const handleSearchChange = (text) => {
    setSearchName(text);
  };

  const handleApplyFilters = () => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== "" && v !== null)
    );
    setFilterVisible(false);
    if (params.type) {
        setActiveTypeTab(params.type);
    } else {
        setActiveTypeTab("all");
    }
    const combinedFilters = {
        ...params,
        filter_zone_id: filters.zone_id,
        name: searchName,
    };
    fetchSeekers(combinedFilters, 1, true);
  };

  const handleReset = () => {
    const resetFilters = {
      zone_id: "",
      type: "",
      attended_centres: null,
      attended_session_1: null,
      attended_session_2: null,
      attended_session_3: null,
      attended_session_4: null,
      from_date: "",
      to_date: "",
      month_1: null,
      month_2: null,
      month_3: null,
      month_4: null,
    };
    setFilters(resetFilters);
    setActiveTypeTab("all");
    setIsSearchVisible(false);
    setSearchName("");
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
      const url = `/users?user_type=seeker&role_id=${role}&zone_id=${zoneid}`;
      const response = await api.get(url);
      setModerators(response.data);
    } catch (error) {
      console.error("Error fetching mentors:", error);
    }
  };
  
  const assignModerator = async () => {
    if (!selectedModerator) return Alert.alert("Please select a caller/mentor");
    try {
      await api.post("/seekers/assign-moderator", {
        moderator_id: selectedModerator,
        seeker_ids: selectedSeekers,
        role: role, 
      });
      Alert.alert("Success", `${modalTitle} assigned successfully!`);
      setModeratorModalVisible(false);
      setSelectedSeekers([]);
      fetchSeekers(currentFilters, 1, true);
    } catch (error) {
      console.error("Error assigning mentor:", error);
      Alert.alert("Error", "Could not assign caller/mentor.");
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
  
  const renderHomeButton = () => (
      <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace('/')}
      >
          <Ionicons name="home-outline" size={24} color="#1F2937" />
      </TouchableOpacity>
  );

  // Filter button now shows an active filter count badge
  const renderHeaderRight = () => (
    <View style={styles.headerRightContainer}>
        <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => {
                setIsSearchVisible(prev => !prev);
                if (isSearchVisible) handleSearchChange(''); 
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
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
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
                  value={searchName}
                  onChangeText={handleSearchChange}
              />
              {searchName.length > 0 && (
                <TouchableOpacity 
                  onPress={() => handleSearchChange('')}
                  style={{padding: 5}}
                >
                  <Ionicons name="close-circle" size={20} color="#A0A0A0" />
                </TouchableOpacity>
              )}
          </View>
      )}

      {/* Tabs — UNCHANGED */}
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
                name: searchName,
              };
              setCurrentFilters(newFilters);
              fetchSeekers(newFilters, 1, true);
            }}
          >
            <Text style={[styles.tabText, activeTypeTab === tab.value && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FlatList — UNCHANGED */}
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
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: selectedSeekers.length > 0 ? 150 : 50 }}
        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>No seekers found matching your criteria.</Text>
        }
      />

      {/* Floating actions — UNCHANGED (Assign button keeps original absolute positioning) */}
      {selectedSeekers.length > 0 && (
        <View style={styles.floatingActions}>
          <TouchableOpacity
            style={[styles.assignButton, isDisabled && styles.assignButtonDisabled]}
            disabled={isDisabled}
            onPress={() => {
              if (!isDisabled) {
                fetchModerators();
                setSelectedModerator(null);
                setModeratorModalVisible(true);
              }
            }}
          >
            <Text style={styles.assignButtonText}>{getButtonLabel()}</Text>
          </TouchableOpacity>
         
          {/* <TouchableOpacity
            style={styles.whatsappButton}
            onPress={() => setWhatsappModalVisible(true)}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.whatsappButtonText}>
              WhatsApp ({selectedSeekers.length})
            </Text>
          </TouchableOpacity> */}
        </View>
      )}

      {/* Filter Modal — new compact dot-based design */}
      <Modal visible={filterVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.modalTitle}>Filter Seekers</Text>
                {activeFilterCount > 0 && (
                  <View style={styles.filterActiveBadge}>
                    <Text style={styles.filterActiveBadgeText}>{activeFilterCount} active</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setFilterVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{paddingBottom: 20}}>

              {/* 1. Date Range */}
              <Text style={styles.sectionTitle}>Date Range</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity 
                  style={[styles.dateButton, { flex: 0.48 }]} 
                  onPress={() => showDatePicker('from_date')}
                >
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                  <Text style={{ color: filters.from_date ? '#000' : '#A0A0A0', fontSize: 14, flex: 1 }}>
                    {filters.from_date || "From Date"}
                  </Text>
                  {filters.from_date ? (
                    <TouchableOpacity onPress={() => setFilters({ ...filters, from_date: "" })}>
                      <Ionicons name="close-circle" size={16} color="#A0A0A0" />
                    </TouchableOpacity>
                  ) : null}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.dateButton, { flex: 0.48 }]} 
                  onPress={() => showDatePicker('to_date')}
                >
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                  <Text style={{ color: filters.to_date ? '#000' : '#A0A0A0', fontSize: 14, flex: 1 }}>
                    {filters.to_date || "To Date"}
                  </Text>
                  {filters.to_date ? (
                    <TouchableOpacity onPress={() => setFilters({ ...filters, to_date: "" })}>
                      <Ionicons name="close-circle" size={16} color="#A0A0A0" />
                    </TouchableOpacity>
                  ) : null}
                </TouchableOpacity>
              </View>

              {/* 2. Pratishthan Session Filter */}
              <Text style={styles.sectionTitle}>Pratishthan Session Filter</Text>
              <View style={styles.fDotRow}>
                <Text style={styles.fDotRowLabel}>Sessions</Text>
                <View style={styles.fDotGroup}>
                  {[1, 2, 3, 4].map((n) => {
                    const key = `attended_session_${n}`;
                    const isOn = filters[key] === true;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[styles.fDot, isOn && styles.fDotActiveBlue]}
                        onPress={() => setFilters({ ...filters, [key]: isOn ? null : true })}
                      >
                        <Text style={[styles.fDotText, isOn && styles.fDotTextActiveBlue]}>{n}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.fDotHint}>tap to filter</Text>
              </View>

              {/* 3. Mentor Activity Filter */}
              <Text style={styles.sectionTitle}>Mentor Activity Filter</Text>
              <View style={styles.fDotRow}>
                <Text style={styles.fDotRowLabel}>Months</Text>
                <View style={styles.fDotGroup}>
                  {[1, 2, 3, 4].map((n) => {
                    const key = `month_${n}`;
                    const isOn = filters[key] === true;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[styles.fDot, isOn && styles.fDotActiveGreen]}
                        onPress={() => setFilters({ ...filters, [key]: isOn ? null : true })}
                      >
                        <Text style={[styles.fDotText, isOn && styles.fDotTextActiveGreen]}>{n}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.fDotHint}>tap to filter</Text>
              </View>

              {/* 4. Seeker Details — Zone + Type */}
              <Text style={styles.sectionTitle}>Seeker Details</Text>

              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={filters.zone_id}
                  onValueChange={(value) => setFilters({ ...filters, zone_id: value })}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="All Zones" value="" color="#A0A0A0" />
                  {zones.map((zone) => (
                    <Picker.Item key={zone.id} label={zone.name} value={zone.id} />
                  ))}
                </Picker>
              </View>

              <View style={styles.fInlineRow}>
                <Text style={styles.fInlineLabel}>Type</Text>
                <View style={styles.fToggleGroup}>
                  {[
                    { label: "All", value: "" },
                    { label: "Pratishthan", value: "1" },
                    { label: "Public", value: "2" },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.fToggleBtn, filters.type === opt.value && styles.fToggleBtnActive]}
                      onPress={() => setFilters({ ...filters, type: opt.value })}
                    >
                      <Text style={[styles.fToggleBtnText, filters.type === opt.value && styles.fToggleBtnTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 5. Activity — Attended Centre */}
              <Text style={styles.sectionTitle}>Activity</Text>
              <View style={styles.fInlineRow}>
                <Text style={styles.fInlineLabel}>Attended Centre</Text>
                <View style={styles.fToggleGroup}>
                  {[
                    { label: "All", value: null },
                    { label: "Yes", value: true },
                    { label: "No", value: false },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={String(opt.value)}
                      style={[styles.fToggleBtn, filters.attended_centres === opt.value && styles.fToggleBtnActive]}
                      onPress={() => setFilters({ ...filters, attended_centres: opt.value })}
                    >
                      <Text style={[styles.fToggleBtnText, filters.attended_centres === opt.value && styles.fToggleBtnTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

            </ScrollView>

            {showPicker && (
              <DateTimePicker
                value={getPickerDate()} 
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()} 
              />
            )}

            <SafeAreaView edges={['bottom']} style={styles.safeAreaFooter}>
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      {/* Mentor/Caller Assignment Modal — UNCHANGED */}
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
                    <Button title={`Assign ${selectedSeekers.length} Seeker(s)`} color="#00BCD4" onPress={assignModerator} />
                </View>
            </View>
        </View>
      </Modal>

    </SafeAreaView>

    <WhatsAppModal
      visible={whatsappModalVisible}
      onClose={() => setWhatsappModalVisible(false)}
      selectedSeekers={selectedSeekers}
      seekers={seekers}
    />
    </>
  );
}

const styles = StyleSheet.create({
  // ── UNCHANGED: all original main-screen styles kept exactly as-is ──
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BACKGROUND_COLOR },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#6B7280' },
  headerRightContainer: { flexDirection: 'row', alignItems: 'center', marginRight: -10 },
  headerIcon: { padding: 10, marginRight: 10 },
  filterButton: { flexDirection: "row", alignItems: "center", backgroundColor: PRIMARY_COLOR, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  filterText: { color: "#fff", marginLeft: 5, fontWeight: "600", fontSize: 14 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD_BACKGROUND, borderRadius: 10, paddingHorizontal: 15, marginHorizontal: 10, marginTop: 0, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, paddingTop: Platform.OS === 'ios' ? 8 : 8, paddingBottom: Platform.OS === 'ios' ? 8 : 8, fontSize: 15, color: '#1F2937' },
  tabsContainer: { flexDirection: "row", justifyContent: "space-around", marginHorizontal: 10, marginBottom: 10, backgroundColor: "#E0F7FA", borderRadius: 8, padding: 2 },
  tab: { flex: 1, paddingVertical: 6, alignItems: "center", borderRadius: 6 },
  activeTab: { backgroundColor: CARD_BACKGROUND, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: "500", color: "#00BCD4" },
  activeTabText: { color: PRIMARY_COLOR, fontWeight: "700" },
  card: { backgroundColor: CARD_BACKGROUND, borderRadius: 12, marginHorizontal: 5, marginVertical: 4, padding: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  selectedCard: { backgroundColor: "#EBF5FF", borderWidth: 2, borderColor: PRIMARY_COLOR, elevation: 4 },
  cardContent: { flexDirection: "row", alignItems: "flex-start" },
  checkboxContainer: { paddingRight: 10, paddingVertical: 2 },
  infoContainer: { flex: 1, marginLeft: 5 },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  name: { fontSize: 15, fontWeight: "700", color: "#1F2937", flex: 1 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  locationText: { fontSize: 13, color: "#4B5563" },
  mobileText: { fontSize: 13, color: "#4B5563" },
  typeBadgeContainer: { marginTop: 4, alignSelf: 'flex-start', backgroundColor: '#F0F9FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#C5E0FF' },
  typeBadgeText: { fontSize: 11, fontWeight: '600', color: '#1E40AF' },
  typeBadgeStatusContainer: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6 },
  typeBadgeStatusText: { fontWeight: "600" },

  // Assign button — kept exactly as original (absolute positioned on the button itself,
  // in addition to the floatingActions wrapper).
  assignButton: {
    position: "absolute",
    bottom: Platform.OS === 'ios' ? 20 : 35,
    left: 10,
    right: 10,
    backgroundColor: PRIMARY_COLOR,
    padding: 15,
    marginBottom: 25,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  assignButtonDisabled: { backgroundColor: "#A0A0A0" },
  assignButtonText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end", paddingBottom: 25 },
  modalContent: { width: "100%", maxHeight: "90%", backgroundColor: CARD_BACKGROUND, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 15, paddingBottom: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  closeButton: { padding: 5 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 20, marginBottom: 10, color: PRIMARY_COLOR, borderBottomWidth: 1, borderBottomColor: "#D1E3FF", paddingBottom: 5 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 15, backgroundColor: '#F9FAFB' },
  pickerWrapper: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, marginBottom: 15, overflow: 'hidden', backgroundColor: '#F9FAFB' },
  picker: { height: 55, width: '100%' },
  pickerItem: { fontSize: 15 },
  optionGroup: { marginBottom: 15 },
  optionGroupLabel: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  optionRow: { flexDirection: "row", flexWrap: 'wrap' },
  filterOption: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, marginRight: 10, marginBottom: 8, borderWidth: 1 },
  unselectedOption: { backgroundColor: "#F3F4F6", borderColor: "#D1D5DB" },
  selectedOption: { backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR },
  filterOptionText: { color: "#374151", fontWeight: "500" },
  selectedOptionText: { color: "#fff" },
  modalFooter: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  resetButton: { padding: 12, borderRadius: 8, backgroundColor: "#F3F4F6", width: '35%', alignItems: 'center' },
  resetButtonText: { color: "#4B5563", fontWeight: '700' },
  applyButton: { padding: 12, borderRadius: 8, backgroundColor: SUCCESS_COLOR, width: '60%', alignItems: 'center' },
  applyButtonText: { color: "#fff", fontWeight: '700' },
  moderatorModalContent: { width: "90%", backgroundColor: CARD_BACKGROUND, borderRadius: 12, padding: 20, alignSelf: 'center', elevation: 10 },
  moderatorItem: { paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedModerator: { backgroundColor: "#EBF5FF", borderRadius: 8 },
  moderatorName: { fontSize: 16, fontWeight: '600' },
  moderatorZone: { fontSize: 13, color: '#6B7280' },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
  homeButton: { marginLeft: 10, padding: 5, paddingRight: 20 },
  statusBadgeRow: { flexDirection: 'row', alignItems: 'center' },
  miniBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, marginLeft: 5 },
  miniBadgeText: { fontSize: 10, fontWeight: 'bold', marginLeft: 2, color: '#333' },

  // Card progress dots — kept at original (smaller) size so the main list is unaffected
  dotGroup: { flexDirection: 'row' },
  miniDot: { width: 14, height: 14, borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginLeft: 2 },
  dotText: { fontSize: 8, fontWeight: 'bold' },

  bottomBadgeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  progressSection: { flexDirection: 'row', alignItems: 'center' },
  indicatorWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 6 },
  indicatorLabel: { fontSize: 9, fontWeight: 'bold', color: '#6B7280', marginRight: 2 },

  // floatingActions wrapper — UNCHANGED
  floatingActions: { position: "absolute", bottom: Platform.OS === "ios" ? 20 : 55, left: 10, right: 10, gap: 8 },
  whatsappButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#25D366", padding: 14, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, elevation: 6 },
  whatsappButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  safeAreaFooter: {},

  // ── NEW: filter button badge ──
  filterBadge: { backgroundColor: "#fff", borderRadius: 8, marginLeft: 6, paddingHorizontal: 5, paddingVertical: 1 },
  filterBadgeText: { color: PRIMARY_COLOR, fontSize: 11, fontWeight: "700" },

  // ── NEW: active badge inside modal header ──
  filterActiveBadge: { backgroundColor: "#185FA5", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  filterActiveBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  // ── NEW: date buttons ──
  dateButton: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 11, marginBottom: 15, backgroundColor: "#F9FAFB" },

  // ── NEW: filter modal dot rows (prefixed fDot* — no collision with card styles) ──
  fDotRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 12, marginBottom: 10 },
  fDotRowLabel: { fontSize: 13, color: "#6B7280", width: 58 },
  fDotGroup: { flexDirection: "row", gap: 6, flex: 1 },
  fDot: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#F3F4F6", borderWidth: 0.5, borderColor: "#D1D5DB" },
  fDotActiveBlue: { backgroundColor: "#007AFF", borderColor: "#005EC4" },
  fDotActiveGreen: { backgroundColor: "#34C759", borderColor: "#248A3D" },
  fDotText: { fontSize: 13, fontWeight: "600", color: "#9CA3AF" },
  fDotTextActiveBlue: { color: "#fff", fontWeight: "700" },
  fDotTextActiveGreen: { color: "#fff", fontWeight: "700" },
  fDotHint: { fontSize: 11, color: "#9CA3AF" },

  // ── NEW: inline row (label + toggle) for Type and Attended Centre ──
  fInlineRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10 },
  fInlineLabel: { fontSize: 14, color: "#1F2937", flex: 1 },
  fToggleGroup: { flexDirection: "row", backgroundColor: "#F3F4F6", borderRadius: 8, overflow: "hidden", borderWidth: 0.5, borderColor: "#D1D5DB" },
  fToggleBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  fToggleBtnActive: { backgroundColor: "#007AFF" },
  fToggleBtnText: { fontSize: 12, color: "#6B7280" },
  fToggleBtnTextActive: { color: "#fff", fontWeight: "700" },
});