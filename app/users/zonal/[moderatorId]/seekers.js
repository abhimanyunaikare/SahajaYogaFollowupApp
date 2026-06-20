import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import api from "../../../../src/api/apiClient.js";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";

// --- Theme Constants ---
const PRIMARY_COLOR = "#007AFF";
const SUCCESS_COLOR = "#34C759";
const BACKGROUND_COLOR = "#F2F2F7";
const CARD_BACKGROUND = "#FFFFFF";
const SUBTLE_TEXT_COLOR = "#8E8E93";
const DEBOUNCE_DELAY = 500;

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
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
};

// --- Filter Option Component ---
const FilterOption = ({ label, isSelected, onPress }) => (
  <TouchableOpacity
    style={[
      styles.filterOption,
      isSelected ? styles.selectedOption : styles.unselectedOption,
    ]}
    onPress={onPress}
  >
    <Text style={[styles.filterOptionText, isSelected && styles.selectedOptionText]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// --- Status Badge Helper ---
const getStatusBadge = (item) => {
  if (item.interested_in_followup === false) {
    return { label: "Not Interested", bg: "#FCEBEB", border: "#F09595", text: "#791F1F" };
  }
  if (item.moderator) {
    return { label: "Mentor Assigned", bg: "#EEEDFE", border: "#AFA9EC", text: "#3C3489" };
  }
  if (item.called === true) {
    return { label: "Seeker Called", bg: "#E1F5EE", border: "#5DCAA5", text: "#085041" };
  }
  if (item.caller) {
    return { label: "Caller Assigned", bg: "#E6F1FB", border: "#85B7EB", text: "#0C447C" };
  }
  return { label: "New Seeker", bg: "#FAEEDA", border: "#EF9F27", text: "#633806" };
};

// --- Seeker Card ---
const SeekerCard = React.memo(({ item, onPress }) => {
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
            style={[styles.miniDot, { backgroundColor: isAttended ? activeColor : "#E5E7EB" }]}
          >
            <Text style={[styles.dotText, { color: isAttended ? "#fff" : "#9CA3AF" }]}>
              {num}
            </Text>
          </View>
        );
      })}
    </View>
  );

  const status = getStatusBadge(item);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
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
              <Text style={[styles.typeBadgeStatusText, { color: status.text }]}>
                {status.label}
              </Text>
            </View>
          </View>

          {/* Location + Mobile */}
          <View style={styles.detailsRow}>
            <Ionicons name="location-outline" size={12} color="#6B7280" style={{ marginRight: 2 }} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.zone?.name ?? "No Zone"}, {item.city || "N/A"}
            </Text>
            <Ionicons name="call-outline" size={12} color="#6B7280" style={{ marginLeft: 12, marginRight: 2 }} />
            <Text style={styles.mobileText}>{item.mobile}</Text>
          </View>

          {/* Dates */}
          <View style={styles.detailsRow}>
            <Ionicons name="calendar-number-outline" size={12} color="#6B7280" style={{ marginRight: 2 }} />
            <Text style={styles.locationText}>{formatDate(item.created_at)}</Text>
            <Ionicons name="today-outline" size={12} color="#6B7280" style={{ marginLeft: 12, marginRight: 2 }} />
            <Text style={styles.mobileText}>{formatDate(item.updated_at)}</Text>
          </View>

          {/* Type Badge + Progress */}
          <View style={styles.bottomBadgeContainer}>
            <View style={styles.typeBadgeContainer}>
              <Text style={styles.typeBadgeText}>
                {item.type === 1 ? "Pratishthan Seeker" : "PP Seeker"}
              </Text>
            </View>
            <View style={styles.progressSection}>
              <View style={styles.indicatorWrapper}>
                <Text style={styles.indicatorLabel}>S:</Text>
                {renderProgressDots("attended_session", PRIMARY_COLOR)}
              </View>
              <View style={[styles.indicatorWrapper, { marginLeft: 10 }]}>
                <Text style={styles.indicatorLabel}>M:</Text>
                {renderProgressDots("month", SUCCESS_COLOR)}
              </View>
            </View>
          </View>

        </View>
      </View>
    </TouchableOpacity>
  );
});

// --- Main Screen ---
export default function ModeratorSeekersScreen() {
  const { moderatorId, name: moderatorName } = useLocalSearchParams();
  const [allSeekers, setAllSeekers] = useState([]);
  const [seekers, setSeekers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [zones, setZones] = useState([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [activeTypeTab, setActiveTypeTab] = useState("all");
  const [showPicker, setShowPicker] = useState(false);
  const [currentMode, setCurrentMode] = useState("from_date");

  const router = useRouter();

  const [filters, setFilters] = useState({
    name: "",
    mobile: "",
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

  const debouncedSearchTerm = useDebounce(filters.name, DEBOUNCE_DELAY);

  // --- Fetch seekers for this moderator ---
  const fetchSeekers = useCallback(async () => {
    if (!moderatorId) return;
    try {
      setRefreshing(true);
      const response = await api.get(`/zones/${moderatorId}/moderatorseekers`);
      setAllSeekers(response.data);
      setSeekers(response.data);
    } catch (error) {
      console.log("Error fetching assigned seekers:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [moderatorId]);

  useEffect(() => { fetchSeekers(); }, [fetchSeekers]);

  // Fetch zones for filter
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

  // --- Client-side filtering ---
  const applyFilters = useCallback(
    (overrides = {}) => {
      const active = { ...filters, ...overrides };
      let result = [...allSeekers];

      if (active.name.trim()) {
        const q = active.name.trim().toLowerCase();
        result = result.filter(
          (s) =>
            `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
            (s.mobile && s.mobile.includes(q))
        );
      }

      if (active.mobile.trim()) {
        result = result.filter((s) => s.mobile && s.mobile.includes(active.mobile.trim()));
      }

      if (active.zone_id !== "") {
        result = result.filter(
          (s) => s.zone?.id === active.zone_id || s.zone_id === active.zone_id
        );
      }

      if (active.type !== "") {
        result = result.filter((s) => String(s.type) === String(active.type));
      }

      if (active.from_date) {
        const from = new Date(active.from_date);
        result = result.filter((s) => s.created_at && new Date(s.created_at) >= from);
      }

      if (active.to_date) {
        const to = new Date(active.to_date);
        to.setHours(23, 59, 59, 999);
        result = result.filter((s) => s.created_at && new Date(s.created_at) <= to);
      }

      if (active.attended_centres !== null) {
        result = result.filter(
          (s) =>
            s.attended_centres === active.attended_centres ||
            (active.attended_centres === true && s.attended_centres == 1) ||
            (active.attended_centres === false && !s.attended_centres)
        );
      }

      [1, 2, 3, 4].forEach((n) => {
        const key = `attended_session_${n}`;
        if (active[key] !== null) {
          result = result.filter((s) => {
            const val = s.checklist?.[`attended_session_${n}`];
            return active[key] ? val === true || val === 1 : val !== true && val !== 1;
          });
        }
      });

      [1, 2, 3, 4].forEach((n) => {
        const key = `month_${n}`;
        if (active[key] !== null) {
          result = result.filter((s) => {
            const val = s.checklist?.[`month_${n}`];
            return active[key] ? val === true || val === 1 : val !== true && val !== 1;
          });
        }
      });

      setSeekers(result);
    },
    [allSeekers, filters]
  );

  // Debounced name search
  useEffect(() => {
    if (!loading) applyFilters({ name: debouncedSearchTerm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]);

  // --- Date Picker ---
  const showDatePicker = (mode) => { setCurrentMode(mode); setShowPicker(true); };

  const onDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (event.type === "set" && selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      setFilters((prev) => ({ ...prev, [currentMode]: `${year}-${month}-${day}` }));
    }
  };

  const getPickerDate = () => {
    const ds = filters[currentMode];
    return ds ? new Date(ds) : new Date();
  };

  const handleSearchChange = (text) => setFilters((prev) => ({ ...prev, name: text }));

  const handleApplyFilters = () => {
    setFilterVisible(false);
    if (filters.type) setActiveTypeTab(filters.type);
    else setActiveTypeTab("all");
    applyFilters();
  };

  const handleReset = () => {
    const reset = {
      name: "", mobile: "", zone_id: "", type: "",
      attended_centres: null,
      attended_session_1: null, attended_session_2: null,
      attended_session_3: null, attended_session_4: null,
      from_date: "", to_date: "",
      month_1: null, month_2: null, month_3: null, month_4: null,
    };
    setFilters(reset);
    setActiveTypeTab("all");
    setIsSearchVisible(false);
    setSeekers(allSeekers);
    setFilterVisible(false);
  };

  const handleTabChange = (value) => {
    setActiveTypeTab(value);
    const newType = value === "all" ? "" : value;
    setFilters((prev) => ({ ...prev, type: newType }));
    applyFilters({ type: newType });
  };

  // --- Header Buttons ---
  const renderHeaderRight = () => (
    <View style={styles.headerRightContainer}>
      <TouchableOpacity
        style={styles.headerIcon}
        onPress={() => {
          setIsSearchVisible((prev) => !prev);
          if (isSearchVisible) handleSearchChange("");
        }}
      >
        <Ionicons name={isSearchVisible ? "close" : "search"} size={24} color="#1F2937" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
        <Ionicons name="filter" size={18} color="#fff" />
        <Text style={styles.filterText}>Filter</Text>
      </TouchableOpacity>
    </View>
  );

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
          title: moderatorName ? `${moderatorName}'s Seekers` : "Assigned Seekers",
          headerRight: renderHeaderRight,
          headerStyle: { backgroundColor: CARD_BACKGROUND },
          headerTitleStyle: { color: "#1F2937" },
        }}
      />

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
            autoFocus
          />
          {filters.name.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange("")} style={{ padding: 5 }}>
              <Ionicons name="close-circle" size={20} color="#A0A0A0" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Type Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { label: "All", value: "all" },
          { label: "Pratishthan", value: "1" },
          { label: "Public", value: "2" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeTypeTab === tab.value && styles.activeTab]}
            onPress={() => handleTabChange(tab.value)}
          >
            <Text style={[styles.tabText, activeTypeTab === tab.value && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={seekers}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchSeekers} tintColor={PRIMARY_COLOR} />
        }
        ListHeaderComponent={() => (
          <View style={styles.summaryBox}>
            <Ionicons name="people" size={20} color="#388E3C" />
            <Text style={styles.summaryText}>
              Showing: <Text style={styles.countNumber}>{seekers.length}</Text>
              {seekers.length !== allSeekers.length && (
                <Text style={styles.totalText}> / {allSeekers.length} total</Text>
              )}
            </Text>
          </View>
        )}
        ListFooterComponent={<View style={{ height: 80 }} />}
        renderItem={({ item }) => (
          <SeekerCard item={item} onPress={() => router.push(`/seeker/${item.id}`)} />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={50} color={SUBTLE_TEXT_COLOR} />
            <Text style={styles.emptyText}>No seekers match your criteria.</Text>
          </View>
        )}
      />

      {/* Filter Modal */}
      <Modal visible={filterVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Seekers</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

              {/* Date Range */}
              <Text style={styles.sectionTitle}>Date Range</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <TouchableOpacity
                  style={[styles.input, { flex: 0.48 }]}
                  onPress={() => showDatePicker("from_date")}
                >
                  <Text style={{ color: filters.from_date ? "#000" : "#A0A0A0" }}>
                    {filters.from_date || "From Date"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.input, { flex: 0.48 }]}
                  onPress={() => showDatePicker("to_date")}
                >
                  <Text style={{ color: filters.to_date ? "#000" : "#A0A0A0" }}>
                    {filters.to_date || "To Date"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* General */}
              <Text style={styles.sectionTitle}>General Details</Text>
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                placeholderTextColor="#A0A0A0"
                keyboardType="phone-pad"
                value={filters.mobile}
                onChangeText={(text) => setFilters({ ...filters, mobile: text })}
              />

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

              {/* Sessions */}
              <Text style={styles.sectionTitle}>Activity Checklist (Pratishthan)</Text>
              {[1, 2, 3, 4].map((n) => (
                <View key={`session-${n}`} style={styles.optionGroup}>
                  <Text style={styles.optionGroupLabel}>
                    {`Attended ${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"} Session`}
                  </Text>
                  <View style={styles.optionRow}>
                    <FilterOption label="Yes" isSelected={filters[`attended_session_${n}`] === true} onPress={() => setFilters({ ...filters, [`attended_session_${n}`]: true })} />
                    <FilterOption label="No" isSelected={filters[`attended_session_${n}`] === false} onPress={() => setFilters({ ...filters, [`attended_session_${n}`]: false })} />
                    <FilterOption label="All" isSelected={filters[`attended_session_${n}`] === null} onPress={() => setFilters({ ...filters, [`attended_session_${n}`]: null })} />
                  </View>
                </View>
              ))}

              {/* Monthly Follow-ups */}
              <Text style={styles.sectionTitle}>Activity Checklist (Mentor)</Text>
              {[1, 2, 3, 4].map((n) => (
                <View key={`month-${n}`} style={styles.optionGroup}>
                  <Text style={styles.optionGroupLabel}>{`Month ${n} Follow-up`}</Text>
                  <View style={styles.optionRow}>
                    <FilterOption label="Done" isSelected={filters[`month_${n}`] === true} onPress={() => setFilters({ ...filters, [`month_${n}`]: true })} />
                    <FilterOption label="Pending" isSelected={filters[`month_${n}`] === false} onPress={() => setFilters({ ...filters, [`month_${n}`]: false })} />
                    <FilterOption label="All" isSelected={filters[`month_${n}`] === null} onPress={() => setFilters({ ...filters, [`month_${n}`]: null })} />
                  </View>
                </View>
              ))}

              {/* Attended Centre */}
              <View style={styles.optionGroup}>
                <Text style={styles.optionGroupLabel}>Attended Centre</Text>
                <View style={styles.optionRow}>
                  <FilterOption label="Yes" isSelected={filters.attended_centres === true} onPress={() => setFilters({ ...filters, attended_centres: true })} />
                  <FilterOption label="No" isSelected={filters.attended_centres === false} onPress={() => setFilters({ ...filters, attended_centres: false })} />
                  <FilterOption label="All" isSelected={filters.attended_centres === null} onPress={() => setFilters({ ...filters, attended_centres: null })} />
                </View>
              </View>

            </ScrollView>

            {showPicker && (
              <DateTimePicker
                value={getPickerDate()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}

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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 12, paddingVertical: 10 },

  // Header
  headerRightContainer: { flexDirection: "row", alignItems: "center", marginRight: -10 },
  headerIcon: { padding: 10, marginRight: 10 },
  filterButton: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: PRIMARY_COLOR, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
  },
  filterText: { color: "#fff", marginLeft: 5, fontWeight: "600", fontSize: 14 },

  // Search
  searchContainer: {
    flexDirection: "row", alignItems: "center", backgroundColor: CARD_BACKGROUND,
    borderRadius: 10, paddingHorizontal: 15, marginHorizontal: 10,
    marginBottom: 10, borderWidth: 1, borderColor: "#E5E7EB",
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 15, color: "#1F2937" },

  // Tabs
  tabsContainer: {
    flexDirection: "row", justifyContent: "space-around",
    marginHorizontal: 10, marginBottom: 10,
    backgroundColor: "#E0F7FA", borderRadius: 8, padding: 2,
  },
  tab: { flex: 1, paddingVertical: 6, alignItems: "center", borderRadius: 6 },
  activeTab: {
    backgroundColor: CARD_BACKGROUND,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 1, elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: "500", color: "#00BCD4" },
  activeTabText: { color: PRIMARY_COLOR, fontWeight: "700" },

  // Summary
  summaryBox: {
    padding: 15, backgroundColor: "#E8F5E9", borderRadius: 12,
    flexDirection: "row", alignItems: "center",
    marginBottom: 15, borderWidth: 1, borderColor: "#C8E6C9",
  },
  summaryText: { fontSize: 15, color: "#333", marginLeft: 10, fontWeight: "500" },
  countNumber: { fontWeight: "bold", color: "#2E7D32", fontSize: 18 },
  totalText: { fontWeight: "400", color: "#777", fontSize: 14 },

  // Card
  card: {
    backgroundColor: CARD_BACKGROUND, borderRadius: 12,
    marginHorizontal: 5, marginVertical: 4, padding: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  cardContent: { flexDirection: "row", alignItems: "flex-start" },
  infoContainer: { flex: 1, marginLeft: 5 },
  nameRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 2,
  },
  name: { fontSize: 15, fontWeight: "700", color: "#1F2937", flex: 1 },
  detailsRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  locationText: { fontSize: 13, color: "#4B5563" },
  mobileText: { fontSize: 13, color: "#4B5563" },
  typeBadgeStatusContainer: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  typeBadgeStatusText: { fontSize: 11, fontWeight: "600" },
  bottomBadgeContainer: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginTop: 8,
  },
  typeBadgeContainer: {
    alignSelf: "flex-start", backgroundColor: "#F0F9FF",
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, borderWidth: 1, borderColor: "#C5E0FF",
  },
  typeBadgeText: { fontSize: 11, fontWeight: "600", color: "#1E40AF" },
  progressSection: { flexDirection: "row", alignItems: "center" },
  indicatorWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F3F4F6", paddingHorizontal: 4, paddingVertical: 2, borderRadius: 6,
  },
  indicatorLabel: { fontSize: 9, fontWeight: "bold", color: "#6B7280", marginRight: 2 },
  dotGroup: { flexDirection: "row" },
  miniDot: {
    width: 14, height: 14, borderRadius: 4,
    justifyContent: "center", alignItems: "center", marginLeft: 2,
  },
  dotText: { fontSize: 8, fontWeight: "bold" },

  // Empty
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: { marginTop: 10, fontSize: 16, color: SUBTLE_TEXT_COLOR },

  // Modal
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
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#E5E7EB",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  closeButton: { padding: 5 },
  sectionTitle: {
    fontSize: 16, fontWeight: "700", marginTop: 20, marginBottom: 10,
    color: PRIMARY_COLOR, borderBottomWidth: 1, borderBottomColor: "#D1E3FF", paddingBottom: 5,
  },
  input: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8,
    padding: 12, marginBottom: 15, fontSize: 15, backgroundColor: "#F9FAFB",
  },
  pickerWrapper: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8,
    marginBottom: 15, overflow: "hidden", backgroundColor: "#F9FAFB",
  },
  picker: { height: 55, width: "100%" },
  pickerItem: { fontSize: 15 },
  optionGroup: { marginBottom: 15 },
  optionGroupLabel: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  optionRow: { flexDirection: "row", flexWrap: "wrap" },
  filterOption: {
    paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20,
    marginRight: 10, marginBottom: 8, borderWidth: 1,
  },
  unselectedOption: { backgroundColor: "#F3F4F6", borderColor: "#D1D5DB" },
  selectedOption: { backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR },
  filterOptionText: { color: "#374151", fontWeight: "500" },
  selectedOptionText: { color: "#fff" },
  modalFooter: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 15, borderTopWidth: 1, borderTopColor: "#E5E7EB",
  },
  resetButton: {
    padding: 12, borderRadius: 8, backgroundColor: "#F3F4F6",
    width: "35%", alignItems: "center",
  },
  resetButtonText: { color: "#4B5563", fontWeight: "700" },
  applyButton: {
    padding: 12, borderRadius: 8, backgroundColor: SUCCESS_COLOR,
    width: "60%", alignItems: "center",
  },
  applyButtonText: { color: "#fff", fontWeight: "700" },
});