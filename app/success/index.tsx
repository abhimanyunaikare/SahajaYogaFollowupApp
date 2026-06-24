import React, { useEffect, useState, useContext, useMemo } from "react";
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
import api from '../../src/api/apiClient';
import { AuthContext } from "../../src/context/AuthContext";
import { useRouter, Stack } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';

// --- Theme Constants ---
const PRIMARY_COLOR    = "#007AFF";
const SUCCESS_COLOR    = "#4CAF50";
const BACKGROUND_COLOR = "#F9F9F9";
const CARD_BACKGROUND  = "#FFFFFF";

// --- Date Formatter ---
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
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
            style={[styles.miniDot, { backgroundColor: isAttended ? activeColor : '#E5E7EB' }]}
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

          {/* Type Badge + Progress Dots */}
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
export default function EstablishedSeekersScreen() {
  const [seekers, setSeekers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTypeTab, setActiveTypeTab] = useState("all");
  const [zones, setZones]           = useState([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [currentMode, setCurrentMode] = useState('from_date');

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

  const { user } = useContext(AuthContext);
  const router = useRouter();

  const activeFilterCount = Object.values(filters).filter((v) => v !== "" && v !== null).length;

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
    const d = filters[currentMode];
    return d ? new Date(d) : new Date();
  };

  const handleResetFilters = () => setFilters({
    zone_id: "", type: "", attended_centres: null,name: "",
    mobile: "",
    attended_session_1: null, attended_session_2: null,
    attended_session_3: null, attended_session_4: null,
    from_date: "", to_date: "",
    month_1: null, month_2: null, month_3: null, month_4: null,
  });

  // --- Fetch seekers ---
  const fetchEstablished = async (type = activeTypeTab) => {
    setLoading(true);
    try {
      let url = `/seekers?is_established=1&zone_id=${user.zone_id}&id=${user.id}&role_id=${user.role_id}`;
      if (type !== "all") url += `&type=${type}`;
      
      const response = await api.get(url);
      setSeekers(response.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchEstablished(); }, []);

  // --- Fetch zones for filter ---
  useEffect(() => {
    api.get("/zones")
      .then(r => setZones(r.data))
      .catch(e => console.error("Error loading zones:", e));
  }, []);

  // --- Client-side filter ---
  const filteredSeekers = useMemo(() => {
    return seekers.filter((item) => {
      const checklist = item.checklist || {};

      if (filters.name) {
        const fullName = `${item.first_name} ${item.last_name}`.toLowerCase();
        if (!fullName.includes(filters.name.toLowerCase())) return false;
      }
      if (filters.mobile) {
        if (!String(item.mobile || "").includes(filters.mobile)) return false;
      }
      if (filters.zone_id && String(item.zone_id) !== String(filters.zone_id)) return false;
      if (filters.type    && String(item.type)    !== String(filters.type))    return false;

      if (filters.attended_centres !== null) {
        const val = checklist.attended_centres === true || checklist.attended_centres === 1;
        if (val !== filters.attended_centres) return false;
      }

      for (let n = 1; n <= 4; n++) {
        const sessKey  = `attended_session_${n}`;
        const monthKey = `month_${n}`;
        if (filters[sessKey] === true) {
          if (!(checklist[sessKey] === true || checklist[sessKey] === 1)) return false;
        }
        if (filters[monthKey] === true) {
          if (!(checklist[monthKey] === true || checklist[monthKey] === 1)) return false;
        }
      }

      if (filters.from_date) {
        const updated = item.updated_at ? new Date(item.updated_at) : null;
        if (!updated || updated < new Date(filters.from_date)) return false;
      }
      if (filters.to_date) {
        const updated  = item.updated_at ? new Date(item.updated_at) : null;
        const toDateEnd = new Date(filters.to_date);
        toDateEnd.setHours(23, 59, 59, 999);
        if (!updated || updated > toDateEnd) return false;
      }

      return true;
    });
  }, [seekers, filters]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  const renderHeaderRight = () => (
    <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
      <Ionicons name="filter" size={18} color="#fff" />
      <Text style={styles.filterText}>Filter</Text>
      {activeFilterCount > 0 && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{
        title: "Established Seekers",
        headerRight: renderHeaderRight,
      }} />

      

      {/* Type Tabs */}
      <View style={styles.tabs}>
        {[
          { value: "all", label: "All" },
          { value: "1",   label: "Pratishthan" },
          { value: "2",   label: "Public" },
        ].map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.tab, activeTypeTab === t.value && styles.activeTab]}
            onPress={() => { setActiveTypeTab(t.value); fetchEstablished(t.value); }}
          >
            <Text style={activeTypeTab === t.value ? styles.activeTabText : styles.tabText}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredSeekers}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<View style={{ height: 150 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchEstablished()} />}
        ListHeaderComponent={
          filteredSeekers.length > 0 ? (
            <View style={styles.headerBanner}>
              <Ionicons name="checkmark-done-circle" size={16} color={SUCCESS_COLOR} />
              <Text style={styles.headerBannerText}>
                {filteredSeekers.length} established seeker{filteredSeekers.length !== 1 ? "s" : ""}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <SeekerCard
            item={item}
            onPress={() => router.push(`/seeker/${item.id}`)}
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#8E8E93" />
            <Text style={styles.emptyTitle}>No Established Seekers</Text>
            <Text style={styles.emptyText}>
              {seekers.length === 0
                ? "No seekers have been established yet."
                : "No seekers match the selected filters."}
            </Text>
          </View>
        )}
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
                    { label: "All",          value: "" },
                    { label: "Pratishthan",  value: "1" },
                    { label: "Public",       value: "2" },
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

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetButton} onPress={handleResetFilters}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={() => setFilterVisible(false)}>
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
  container:   { flex: 1, backgroundColor: BACKGROUND_COLOR },
  loader:      { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 10, paddingVertical: 10 },

  // --- Search Bar ---
  filterTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
    paddingVertical: 0,
  },

  // --- Type Tabs ---
  tabs: { flexDirection: 'row', backgroundColor: '#E0F7FA', margin: 10, borderRadius: 8, padding: 2 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 6 },
  activeTab: { backgroundColor: '#FFF' },
  tabText: { color: '#00BCD4', fontWeight: '500' },
  activeTabText: { color: PRIMARY_COLOR, fontWeight: '700' },

  // --- Header Banner ---
  headerBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#E1F5EE", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10,
  },
  headerBannerText: { fontSize: 13, color: SUCCESS_COLOR, fontWeight: "600" },

  // --- Card ---
  card: {
    backgroundColor: CARD_BACKGROUND, borderRadius: 12,
    marginHorizontal: 5, marginVertical: 4, padding: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  cardContent:   { flexDirection: "row", alignItems: "flex-start" },
  infoContainer: { flex: 1, marginLeft: 5 },
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

  // --- Empty State ---
  emptyContainer: { padding: 40, alignItems: "center", marginTop: 60 },
  emptyTitle:     { marginTop: 12, fontSize: 17, fontWeight: "700", color: "#1C1C1E" },
  emptyText:      { marginTop: 6, fontSize: 14, color: "#8E8E93", textAlign: "center" },

  // --- Filter Button ---
  filterButton: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
  },
  filterText:      { color: "#fff", marginLeft: 5, fontWeight: "600", fontSize: 14 },
  filterBadge:     { backgroundColor: "#fff", borderRadius: 8, marginLeft: 6, paddingHorizontal: 5, paddingVertical: 1 },
  filterBadgeText: { color: PRIMARY_COLOR, fontSize: 11, fontWeight: "700" },

  // --- Filter Modal ---
  modalOverlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end", paddingBottom: 25 },
  modalContent:  { width: "100%", maxHeight: "90%", backgroundColor: CARD_BACKGROUND, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 15, paddingBottom: 25 },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle:    { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  closeButton:   { padding: 5 },
  sectionTitle:  { fontSize: 16, fontWeight: "700", marginTop: 20, marginBottom: 10, color: PRIMARY_COLOR, borderBottomWidth: 1, borderBottomColor: "#D1E3FF", paddingBottom: 5 },
  pickerWrapper: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, marginBottom: 15, overflow: 'hidden', backgroundColor: '#F9FAFB' },
  picker:        { height: 55, width: '100%' },
  pickerItem:    { fontSize: 15 },
  modalFooter:   { flexDirection: "row", justifyContent: "space-between", paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  resetButton:   { padding: 12, borderRadius: 8, backgroundColor: "#F3F4F6", width: '35%', alignItems: 'center' },
  resetButtonText: { color: "#4B5563", fontWeight: '700' },
  applyButton:   { padding: 12, borderRadius: 8, backgroundColor: SUCCESS_COLOR, width: '60%', alignItems: 'center' },
  applyButtonText: { color: "#fff", fontWeight: '700' },

  filterActiveBadge:     { backgroundColor: "#185FA5", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  filterActiveBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  dateButton: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 11, marginBottom: 15, backgroundColor: "#F9FAFB" },

  fDotRow:      { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 12, marginBottom: 10 },
  fDotRowLabel: { fontSize: 13, color: "#6B7280", width: 58 },
  fDotGroup:    { flexDirection: "row", gap: 6, flex: 1 },
  fDot:         { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#F3F4F6", borderWidth: 0.5, borderColor: "#D1D5DB" },
  fDotActiveBlue:  { backgroundColor: "#007AFF", borderColor: "#005EC4" },
  fDotActiveGreen: { backgroundColor: "#34C759", borderColor: "#248A3D" },
  fDotText:              { fontSize: 13, fontWeight: "600", color: "#9CA3AF" },
  fDotTextActiveBlue:  { color: "#fff", fontWeight: "700" },
  fDotTextActiveGreen: { color: "#fff", fontWeight: "700" },
  fDotHint: { fontSize: 11, color: "#9CA3AF" },

  fInlineRow:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10 },
  fInlineLabel:        { fontSize: 14, color: "#1F2937", flex: 1 },
  fToggleGroup:        { flexDirection: "row", backgroundColor: "#F3F4F6", borderRadius: 8, overflow: "hidden", borderWidth: 0.5, borderColor: "#D1D5DB" },
  fToggleBtn:          { paddingVertical: 6, paddingHorizontal: 10 },
  fToggleBtnActive:    { backgroundColor: "#007AFF" },
  fToggleBtnText:      { fontSize: 12, color: "#6B7280" },
  fToggleBtnTextActive: { color: "#fff", fontWeight: "700" },
});