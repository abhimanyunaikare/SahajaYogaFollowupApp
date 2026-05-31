import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import api from "../../src/api/apiClient";
import { Ionicons } from "@expo/vector-icons";

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

// --- Seeker Card (unified with SeekersListScreen) ---
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


export default function SeekersCalledScreen() {
  const params = useLocalSearchParams();
  const id     = Array.isArray(params.id)   ? params.id[0]   : params.id;
  const name   = Array.isArray(params.name) ? params.name[0] : params.name;
  const memberName = decodeURIComponent(name || "Member");

  const [seekers, setSeekers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCalledSeekers = async () => {
      try {
        const response = await api.get(`/users/${id}/seekers-called`);
        setSeekers(response.data);
      } catch (error) {
        console.log("Error fetching called seekers:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCalledSeekers();
  }, [id]);

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
          title: `${memberName} — Called Seekers`,
          headerBackTitle: "Team",
          headerStyle: { backgroundColor: CARD_BACKGROUND },
          headerTitleStyle: { color: "#1F2937" },
        }}
      />

      <FlatList
        data={seekers}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<View style={{ height: 150 }} />}
        ListHeaderComponent={
          seekers.length > 0 ? (
            <View style={styles.headerBanner}>
              <Ionicons name="checkmark-circle" size={16} color={SUCCESS_COLOR} />
              <Text style={styles.headerBannerText}>
                {seekers.length} seeker{seekers.length !== 1 ? "s" : ""} called by {memberName}
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
            <Ionicons name="call-outline" size={60} color="#8E8E93" />
            <Text style={styles.emptyTitle}>No Called Seekers</Text>
            <Text style={styles.emptyText}>
              {memberName} hasn't called any seekers yet.
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: BACKGROUND_COLOR },
  loader:      { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 10, paddingVertical: 10 },

  headerBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#E1F5EE", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10,
  },
  headerBannerText: { fontSize: 13, color: SUCCESS_COLOR, fontWeight: "600" },

  // --- Card (matches SeekersListScreen exactly) ---
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

  typeBadgeStatusContainer: {
    borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  typeBadgeStatusText: { fontSize: 11, fontWeight: '600' },

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

  emptyContainer: { padding: 40, alignItems: "center", marginTop: 60 },
  emptyTitle:     { marginTop: 12, fontSize: 17, fontWeight: "700", color: "#1C1C1E" },
  emptyText:      { marginTop: 6, fontSize: 14, color: "#8E8E93", textAlign: "center" },
});