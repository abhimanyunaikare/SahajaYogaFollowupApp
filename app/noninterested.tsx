import React, { useEffect, useState, useContext, useCallback } from "react";
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
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../src/api/apiClient.js";
import { AuthContext } from '../src/context/AuthContext';
import { useRouter, Stack } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

// --- Constants ---
const PRIMARY_COLOR    = "#007AFF";
const SUCCESS_COLOR    = "#4CAF50";
const BACKGROUND_COLOR = "#F9F9F9";
const CARD_BACKGROUND  = "#FFFFFF";
const DEBOUNCE_DELAY   = 500;

// --- Debounce Hook ---
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- Date Formatter ---
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// --- Status Badge Helper ---
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

// --- Seeker Card ---
const SeekerCard = React.memo(({ item, onViewDetails }) => {
  const checklist = item.checklist || {};

  const renderProgressDots = (prefix, activeColor) => (
    <View style={styles.dotGroup}>
      {[1, 2, 3, 4].map((num) => {
        const isAttended =
          checklist[`${prefix}_${num}`] === true ||
          checklist[`${prefix}_${num}`] === 1;
        return (
          <View
            key={`${prefix}-${num}`}
            style={[
              styles.miniDot,
              { backgroundColor: isAttended ? activeColor : '#E5E7EB' },
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

  const status = getStatusBadge(item);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={onViewDetails}
    >
      <View style={styles.cardContent}>
        <View style={styles.infoContainer}>

          {/* Name + Status Badge */}
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.first_name} {item.last_name}
            </Text>
            <View style={[
              styles.typeBadgeStatusContainer,
              { backgroundColor: status.bg, borderColor: status.border, padding: 2 },
            ]}>
              <Text style={[styles.typeBadgeStatusText, { color: status.text, fontSize: 11 }]}>
                {status.label}
              </Text>
            </View>
          </View>

          {/* Location + Mobile */}
          <View style={styles.detailsRow}>
            <Ionicons name="location-outline" size={12} color="#6B7280" style={{ marginRight: 2 }} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.zone?.name}, {item.city || "N/A"}
            </Text>
            <Ionicons name="call-outline" size={12} color="#6B7280" style={{ marginLeft: 12, marginRight: 2 }} />
            <Text style={styles.mobileText}>{item.mobile}</Text>
          </View>

          {/* Dates */}
          <View style={styles.detailsRow}>
            <Ionicons name="calendar-number-outline" size={12} color="#6B7280" style={{ marginRight: 2 }} />
            <Text style={styles.locationText} numberOfLines={1}>{formatDate(item.created_at)}</Text>
            <Ionicons name="today-outline" size={12} color="#6B7280" style={{ marginLeft: 12, marginRight: 2 }} />
            <Text style={styles.mobileText}>{formatDate(item.updated_at)}</Text>
          </View>

          {/* Type Badge + Progress Indicators */}
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


// --- Main Screen ---
export default function NonInterestedSeekersScreen() {
  const [seekers, setSeekers]                 = useState([]);
  const [page, setPage]                       = useState(1);
  const [loading, setLoading]                 = useState(true);
  const [hasMore, setHasMore]                 = useState(true);
  const [refreshing, setRefreshing]           = useState(false);
  const [filterVisible, setFilterVisible]     = useState(false);
  const [initialLoading, setInitialLoading]   = useState(true);
  const [currentFilters, setCurrentFilters]   = useState({});
  const [activeTypeTab, setActiveTypeTab]     = useState("all");
  const [zones, setZones]                     = useState([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [showPicker, setShowPicker]           = useState(false);
  const [currentMode, setCurrentMode]         = useState('from_date');

  const router = useRouter();
  const { user } = useContext(AuthContext);
  const role = user?.role_id ? Number(user.role_id) : null;

  const [filters, setFilters] = useState({
    name: "",
    mobile: "",
    zone_id: "",
    type: "",
    attended_puja: null,
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

  const debouncedSearchTerm = useDebounce(filters.name, DEBOUNCE_DELAY);

  // Count active filters (exclude name since it has its own search bar)
  const activeFilterCount = Object.entries(filters).filter(
    ([key, v]) => key !== 'name' && v !== "" && v !== null
  ).length;

  // --- Date Picker helpers ---
  const showDatePicker = (mode) => { setCurrentMode(mode); setShowPicker(true); };

  const onDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (event.type === 'set' && selectedDate) {
      const year  = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day   = String(selectedDate.getDate()).padStart(2, '0');
      setFilters(prev => ({ ...prev, [currentMode]: `${year}-${month}-${day}` }));
    }
  };

  const getPickerDate = () => {
    const dateString = filters[currentMode];
    return dateString ? new Date(dateString) : new Date();
  };

  // Always lock interested_in_followup to false (non-interested seekers only)
  const fetchSeekers = async (filters = {}, pageNumber = 1, refreshing = false) => {
    if (loading && !refreshing && pageNumber !== 1) return;

    try {
      if (pageNumber === 1 && !refreshing) setInitialLoading(true);
      setLoading(true);

      const defaultContextParams = {
        zone_id: user.zone_id,
        role_id: role,
        id: user.id,
        interested_in_followup: 0,
      };

      const finalFilters = { ...filters, ...defaultContextParams };

      const queryParams = Object.entries(finalFilters)
        .filter(([_, value]) => value !== "" && value !== null)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join("&");

      const response = await api.get(`/seekers?${queryParams}&page=${pageNumber}`);
      const data       = response.data.data || [];
      const isLastPage = response.data.current_page >= response.data.last_page;

      setSeekers((prev) =>
        refreshing || pageNumber === 1 ? data : [...prev, ...data]
      );
      setHasMore(!isLastPage);
      setPage(pageNumber);
      setCurrentFilters(filters);
    } catch (error) {
      console.error("Error fetching non-interested seekers:", error.message);
    } finally {
      setLoading(false);
      setInitialLoading(false);
      setRefreshing(false);
    }
  };

  // Debounced name search
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

  // Re-fetch on screen focus
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      fetchSeekers(currentFilters, 1, true);
    }, [user?.id, user?.zone_id, role, currentFilters])
  );

  // Fetch zones
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
    if (!loading && hasMore) fetchSeekers(currentFilters, page + 1);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSeekers(currentFilters, 1, true);
  };

  const handleSearchChange = (text) => {
    setFilters((prev) => ({ ...prev, name: text }));
  };

  const handleApplyFilters = () => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== "" && v !== null)
    );
    setFilterVisible(false);
    setActiveTypeTab(params.type || "all");
    fetchSeekers({ ...params, filter_zone_id: filters.zone_id, name: filters.name }, 1, true);
  };

  const handleReset = () => {
    const resetFilters = {
      name: "",
      mobile: "",
      zone_id: "",
      type: "",
      attended_puja: null,
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
    fetchSeekers(resetFilters, 1, true);
    setFilterVisible(false);
  };

  const renderItem = ({ item }) => (
    <SeekerCard
      item={item}
      onViewDetails={() => router.push(`/seeker/${item.id}`)}
    />
  );

  if (initialLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={{ marginTop: 10, color: "#555", fontSize: 16 }}>Loading data...</Text>
      </View>
    );
  }

  const renderHomeButton = () => (
    <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/')}>
      <Ionicons name="home-outline" size={24} color="#1F2937" />
    </TouchableOpacity>
  );

  const renderHeaderRight = () => (
    <View style={styles.headerRightContainer}>
      <TouchableOpacity
        style={styles.headerIcon}
        onPress={() => {
          setIsSearchVisible((prev) => !prev);
          if (isSearchVisible) handleSearchChange('');
        }}
      >
        <Ionicons name={isSearchVisible ? "close" : "search"} size={24} color="#1F2937" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
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
          title: "Non-Interested Seekers",
          headerRight: renderHeaderRight,
          headerLeft: renderHomeButton,
          headerStyle: { backgroundColor: CARD_BACKGROUND },
          headerTitleStyle: { color: "#1F2937" },
        }}
      />

      <SafeAreaView style={styles.container}>

        {/* Search Bar */}
        {isSearchVisible && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Name or Mobile..."
              placeholderTextColor="#A0A0A0"
              value={filters.name}
              onChangeText={handleSearchChange}
            />
            {filters.name.length > 0 && (
              <TouchableOpacity onPress={() => handleSearchChange('')} style={{ padding: 5 }}>
                <Ionicons name="close-circle" size={20} color="#A0A0A0" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Type Tabs */}
        <View style={styles.tabsContainer}>
          {[
            { label: "All",         value: "all" },
            { label: "Pratishthan", value: "1"   },
            { label: "Public",      value: "2"   },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.value}
              style={[styles.tab, activeTypeTab === tab.value && styles.activeTab]}
              onPress={() => {
                setActiveTypeTab(tab.value);
                const newFilters = {
                  ...currentFilters,
                  type: tab.value === "all" ? "" : tab.value,
                  name: filters.name,
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

        {/* Seeker List */}
        <FlatList
          data={seekers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={PRIMARY_COLOR}
            />
          }
          ListFooterComponent={
            loading && !refreshing && page > 1 ? (
              <ActivityIndicator size="small" color={PRIMARY_COLOR} style={{ padding: 10 }} />
            ) : null
          }
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 50 }}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={60} color="#8E8E93" />
                <Text style={styles.emptyTitle}>No Non-Interested Seekers</Text>
                <Text style={styles.emptyText}>No seekers match the selected filters.</Text>
              </View>
            )
          }
        />

        {/* Filter Modal */}
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

              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

                {/* Date Range */}
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
                      <TouchableOpacity onPress={() => setFilters(p => ({ ...p, from_date: "" }))}>
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
                      <TouchableOpacity onPress={() => setFilters(p => ({ ...p, to_date: "" }))}>
                        <Ionicons name="close-circle" size={16} color="#A0A0A0" />
                      </TouchableOpacity>
                    ) : null}
                  </TouchableOpacity>
                </View>

                {/* Search */}
                <Text style={styles.sectionTitle}>Search</Text>
                <View style={styles.fInlineRow}>
                  <Ionicons name="person-outline" size={16} color="#6B7280" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.filterTextInput}
                    placeholder="Search by name..."
                    placeholderTextColor="#A0A0A0"
                    value={filters.name}
                    onChangeText={(text) => setFilters(p => ({ ...p, name: text }))}
                    autoCorrect={false}
                  />
                  {filters.name.length > 0 && (
                    <TouchableOpacity onPress={() => setFilters(p => ({ ...p, name: "" }))}>
                      <Ionicons name="close-circle" size={16} color="#A0A0A0" />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.fInlineRow}>
                  <Ionicons name="call-outline" size={16} color="#6B7280" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.filterTextInput}
                    placeholder="Search by mobile..."
                    placeholderTextColor="#A0A0A0"
                    value={filters.mobile}
                    onChangeText={(text) => setFilters(p => ({ ...p, mobile: text }))}
                    keyboardType="phone-pad"
                  />
                  {filters.mobile.length > 0 && (
                    <TouchableOpacity onPress={() => setFilters(p => ({ ...p, mobile: "" }))}>
                      <Ionicons name="close-circle" size={16} color="#A0A0A0" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Pratishthan Sessions */}
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
                          onPress={() => setFilters(p => ({ ...p, [key]: isOn ? null : true }))}
                        >
                          <Text style={[styles.fDotText, isOn && styles.fDotTextActiveBlue]}>{n}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={styles.fDotHint}>tap to filter</Text>
                </View>

                {/* Monthly Follow-up */}
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
                          onPress={() => setFilters(p => ({ ...p, [key]: isOn ? null : true }))}
                        >
                          <Text style={[styles.fDotText, isOn && styles.fDotTextActiveGreen]}>{n}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={styles.fDotHint}>tap to filter</Text>
                </View>

                {/* Zone + Type */}
                <Text style={styles.sectionTitle}>Seeker Details</Text>

                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={filters.zone_id}
                    onValueChange={(value) => setFilters(p => ({ ...p, zone_id: value }))}
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
                      { label: "All",         value: "" },
                      { label: "Pratishthan", value: "1" },
                      { label: "Public",      value: "2" },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.fToggleBtn, filters.type === opt.value && styles.fToggleBtnActive]}
                        onPress={() => setFilters(p => ({ ...p, type: opt.value }))}
                      >
                        <Text style={[styles.fToggleBtnText, filters.type === opt.value && styles.fToggleBtnTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Activity */}
                <Text style={styles.sectionTitle}>Activity</Text>
                <View style={styles.fInlineRow}>
                  <Text style={styles.fInlineLabel}>Attended Centre</Text>
                  <View style={styles.fToggleGroup}>
                    {[
                      { label: "All", value: null },
                      { label: "Yes", value: true },
                      { label: "No",  value: false },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={String(opt.value)}
                        style={[styles.fToggleBtn, filters.attended_centres === opt.value && styles.fToggleBtnActive]}
                        onPress={() => setFilters(p => ({ ...p, attended_centres: opt.value }))}
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

      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: BACKGROUND_COLOR },
  loader:     { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BACKGROUND_COLOR },

  // --- Empty State ---
  emptyContainer: { padding: 40, alignItems: "center", marginTop: 60 },
  emptyTitle:     { marginTop: 12, fontSize: 17, fontWeight: "700", color: "#1C1C1E" },
  emptyText:      { marginTop: 6, fontSize: 14, color: "#8E8E93", textAlign: "center" },

  // --- Header ---
  headerRightContainer: { flexDirection: 'row', alignItems: 'center', marginRight: -10 },
  headerIcon:   { padding: 10, marginRight: 10 },
  filterButton: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: PRIMARY_COLOR, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
  },
  filterText:      { color: "#fff", marginLeft: 5, fontWeight: "600", fontSize: 14 },
  filterBadge:     { backgroundColor: "#fff", borderRadius: 8, marginLeft: 6, paddingHorizontal: 5, paddingVertical: 1 },
  filterBadgeText: { color: PRIMARY_COLOR, fontSize: 11, fontWeight: "700" },
  homeButton: { marginLeft: 10, padding: 5, paddingRight: 20 },

  // --- Search Bar ---
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: CARD_BACKGROUND,
    borderRadius: 10, paddingHorizontal: 15, marginHorizontal: 10,
    marginTop: 0, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchIcon:  { marginRight: 10 },
  searchInput: {
    flex: 1,
    paddingTop:    Platform.OS === 'ios' ? 8 : 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
    fontSize: 15, color: '#1F2937',
  },

  // --- Tabs ---
  tabsContainer: {
    flexDirection: "row", justifyContent: "space-around",
    marginHorizontal: 10, marginBottom: 10,
    backgroundColor: "#E0F7FA", borderRadius: 8, padding: 2,
  },
  tab:         { flex: 1, paddingVertical: 6, alignItems: "center", borderRadius: 6 },
  activeTab:   {
    backgroundColor: CARD_BACKGROUND,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 1, elevation: 2,
  },
  tabText:       { fontSize: 13, fontWeight: "500", color: "#00BCD4" },
  activeTabText: { color: PRIMARY_COLOR, fontWeight: "700" },

  // --- Card ---
  card: {
    backgroundColor: CARD_BACKGROUND, borderRadius: 12,
    marginHorizontal: 5, marginVertical: 4, padding: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  cardContent:   { flexDirection: "row", alignItems: "flex-start" },
  infoContainer: { flex: 1 },
  nameRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 2,
  },
  name:         { fontSize: 15, fontWeight: "700", color: "#1F2937", flex: 1 },
  detailsRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  locationText: { fontSize: 13, color: "#4B5563" },
  mobileText:   { fontSize: 13, color: "#4B5563" },

  typeBadgeContainer: {
    marginTop: 4, alignSelf: 'flex-start',
    backgroundColor: '#F0F9FF', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, borderWidth: 1, borderColor: '#C5E0FF',
  },
  typeBadgeText: { fontSize: 11, fontWeight: '600', color: '#1E40AF' },

  typeBadgeStatusContainer: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  typeBadgeStatusText:      { fontSize: 11, fontWeight: '600' },

  bottomBadgeContainer: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 8,
  },
  progressSection:  { flexDirection: 'row', alignItems: 'center' },
  indicatorWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 6,
  },
  indicatorLabel: { fontSize: 9, fontWeight: 'bold', color: '#6B7280', marginRight: 2 },
  dotGroup:  { flexDirection: 'row' },
  miniDot: {
    width: 14, height: 14, borderRadius: 4,
    justifyContent: 'center', alignItems: 'center', marginLeft: 2,
  },
  dotText: { fontSize: 8, fontWeight: 'bold' },

  // --- Filter Modal ---
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end", paddingBottom: 25,
  },
  modalContent: {
    width: "100%", maxHeight: "90%", backgroundColor: CARD_BACKGROUND,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 15, paddingBottom: 25,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  modalTitle:  { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  closeButton: { padding: 5 },
  sectionTitle: {
    fontSize: 16, fontWeight: "700", marginTop: 20, marginBottom: 10,
    color: PRIMARY_COLOR, borderBottomWidth: 1, borderBottomColor: "#D1E3FF", paddingBottom: 5,
  },
  pickerWrapper: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8,
    marginBottom: 15, overflow: 'hidden', backgroundColor: '#F9FAFB',
  },
  picker:     { height: 55, width: '100%' },
  pickerItem: { fontSize: 15 },

  safeAreaFooter: {},
  modalFooter: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  resetButton: {
    padding: 12, borderRadius: 8, backgroundColor: "#F3F4F6",
    width: '35%', alignItems: 'center',
  },
  resetButtonText: { color: "#4B5563", fontWeight: '700' },
  applyButton: {
    padding: 12, borderRadius: 8, backgroundColor: SUCCESS_COLOR,
    width: '60%', alignItems: 'center',
  },
  applyButtonText: { color: "#fff", fontWeight: '700' },

  filterActiveBadge:     { backgroundColor: "#185FA5", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  filterActiveBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  dateButton: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8,
    padding: 11, marginBottom: 15, backgroundColor: "#F9FAFB",
  },

  // --- Inline filter rows ---
  fInlineRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB",
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10,
  },
  fInlineLabel:  { fontSize: 14, color: "#1F2937", flex: 1 },
  filterTextInput: { flex: 1, fontSize: 14, color: '#1C1C1E', paddingVertical: 0 },

  fToggleGroup:         { flexDirection: "row", backgroundColor: "#F3F4F6", borderRadius: 8, overflow: "hidden", borderWidth: 0.5, borderColor: "#D1D5DB" },
  fToggleBtn:           { paddingVertical: 6, paddingHorizontal: 10 },
  fToggleBtnActive:     { backgroundColor: "#007AFF" },
  fToggleBtnText:       { fontSize: 12, color: "#6B7280" },
  fToggleBtnTextActive: { color: "#fff", fontWeight: "700" },

  // --- Dot selectors ---
  fDotRow:      { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 12, marginBottom: 10 },
  fDotRowLabel: { fontSize: 13, color: "#6B7280", width: 58 },
  fDotGroup:    { flexDirection: "row", gap: 6, flex: 1 },
  fDot:         { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#F3F4F6", borderWidth: 0.5, borderColor: "#D1D5DB" },
  fDotActiveBlue:      { backgroundColor: "#007AFF", borderColor: "#005EC4" },
  fDotActiveGreen:     { backgroundColor: "#34C759", borderColor: "#248A3D" },
  fDotText:            { fontSize: 13, fontWeight: "600", color: "#9CA3AF" },
  fDotTextActiveBlue:  { color: "#fff", fontWeight: "700" },
  fDotTextActiveGreen: { color: "#fff", fontWeight: "700" },
  fDotHint: { fontSize: 11, color: "#9CA3AF" },
});