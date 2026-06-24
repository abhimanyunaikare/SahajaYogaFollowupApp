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
        const isAttended = !!checklist[`${prefix}_${num}`];
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
export default function UnassignedSeekersScreen() {
  const { zoneId, name: zoneName } = useLocalSearchParams();
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

  const activeFilterCount = Object.values(filters).filter((v) => v !== "" && v !== null).length;

  // --- Fetch unassigned seekers (original endpoint preserved) ---
  const fetchSeekers = useCallback(async () => {
    if (!zoneId) return;
    try {
      setRefreshing(true);
      const response = await api.get(`/zones/${zoneId}/seekers?status=unassigned`);
      setAllSeekers(response.data);
      setSeekers(response.data);
    } catch (error) {
      console.log("Error fetching unassigned seekers:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [zoneId]);

  useEffect(() => { fetchSeekers(); }, [fetchSeekers]);

  // Fetch zones for filter picker
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
        {activeFilterCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
          </View>
        )}
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
          title: zoneName ? `${zoneName} — Unassigned` : "Unassigned Seekers",
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
            <Ionicons name="person-remove-outline" size={20} color="#C62828" />
            <Text style={styles.summaryText}>
              Unassigned:{" "}
              <Text style={styles.countNumber}>{seekers.length}</Text>
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
            <Ionicons name="checkmark-circle-outline" size={50} color={SUCCESS_COLOR} />
            <Text style={styles.emptyTitle}>All Assigned!</Text>
            <Text style={styles.emptyText}>
              {allSeekers.length === 0
                ? "No unassigned seekers in this zone."
                : "No seekers match your filters."}
            </Text>
          </View>
        )}
      />

      {/* Filter Modal */}
      <Modal visible={filterVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
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
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <TouchableOpacity
                  style={[styles.dateButton, { flex: 0.48 }]}
                  onPress={() => showDatePicker("from_date")}
                >
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                  <Text style={{ color: filters.from_date ? "#000" : "#A0A0A0", fontSize: 14, flex: 1 }}>
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
                  onPress={() => showDatePicker("to_date")}
                >
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                  <Text style={{ color: filters.to_date ? "#000" : "#A0A0A0", fontSize: 14, flex: 1 }}>
                    {filters.to_date || "To Date"}
                  </Text>
                  {filters.to_date ? (
                    <TouchableOpacity onPress={() => setFilters({ ...filters, to_date: "" })}>
                      <Ionicons name="close-circle" size={16} color="#A0A0A0" />
                    </TouchableOpacity>
                  ) : null}
                </TouchableOpacity>
              </View>

              {/* Search */}
              <Text style={styles.sectionTitle}>Search</Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#A0A0A0"
                value={filters.name}
                onChangeText={(text) => setFilters({ ...filters, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                placeholderTextColor="#A0A0A0"
                keyboardType="phone-pad"
                value={filters.mobile}
                onChangeText={(text) => setFilters({ ...filters, mobile: text })}
              />

              {/* Pratishthan Session Filter */}
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

              {/* Mentor Activity Filter */}
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

              {/* Seeker Details — Zone + Type */}
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

              {/* Activity */}
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

  // Search Bar
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
    padding: 15, backgroundColor: "#FFEBEE", borderRadius: 12,
    flexDirection: "row", alignItems: "center",
    marginBottom: 15, borderWidth: 1, borderColor: "#FFCDD2",
  },
  summaryText: { fontSize: 15, color: "#333", marginLeft: 10, fontWeight: "500" },
  countNumber: { fontWeight: "bold", color: "#C62828", fontSize: 18 },
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
  emptyTitle: { marginTop: 12, fontSize: 17, fontWeight: "700", color: "#1C1C1E" },
  emptyText: { marginTop: 6, fontSize: 14, color: SUBTLE_TEXT_COLOR, textAlign: "center" },

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

  // Filter button badge
  filterBadge: { backgroundColor: "#fff", borderRadius: 8, marginLeft: 6, paddingHorizontal: 5, paddingVertical: 1 },
  filterBadgeText: { color: PRIMARY_COLOR, fontSize: 11, fontWeight: "700" },

  // Active badge inside modal header
  filterActiveBadge: { backgroundColor: "#185FA5", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  filterActiveBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  // Date buttons
  dateButton: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 11, marginBottom: 15, backgroundColor: "#F9FAFB" },

  // Dot rows
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

  // Inline toggle rows
  fInlineRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10 },
  fInlineLabel: { fontSize: 14, color: "#1F2937", flex: 1 },
  fToggleGroup: { flexDirection: "row", backgroundColor: "#F3F4F6", borderRadius: 8, overflow: "hidden", borderWidth: 0.5, borderColor: "#D1D5DB" },
  fToggleBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  fToggleBtnActive: { backgroundColor: "#007AFF" },
  fToggleBtnText: { fontSize: 12, color: "#6B7280" },
  fToggleBtnTextActive: { color: "#fff", fontWeight: "700" },
});