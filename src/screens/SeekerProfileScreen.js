import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useState, useCallback, useContext } from "react";
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity,
  View, Linking, Alert, Switch
} from "react-native";
import api from "../api/apiClient";
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from "../../src/context/AuthContext";
import * as Clipboard from 'expo-clipboard';

const PRIMARY_COLOR = "#007AFF";

// ─── Ordinal helper ──────────────────────────────────────────────────────────
const getOrdinal = (n) => ['1st', '2nd', '3rd', '4th'][n - 1] ?? `${n}th`;

// ─── Helper: Status Badge ────────────────────────────────────────────────────
const StatusBadge = ({ isTrue }) => (
  <View style={[styles.statusBadge, isTrue ? styles.statusYes : styles.statusNo]}>
    <Text style={styles.badgeText}>{isTrue ? "Yes" : "No"}</Text>
  </View>
);

// ─── Helper: Month Badge (softer "Pending" instead of red "No") ──────────────
const MonthBadge = ({ isTrue }) => (
  <View style={[styles.statusBadge, isTrue ? styles.statusYes : styles.statusPending]}>
    <Text style={styles.badgeText}>{isTrue ? "Done" : "Pending"}</Text>
  </View>
);

// ─── Helper: Profile Detail Row ──────────────────────────────────────────────
const ProfileDetail = ({ iconName, label, value, subValue }) => (
  <View style={styles.detailRow}>
    <Ionicons name={iconName} size={18} color={PRIMARY_COLOR} style={styles.detailIcon} />
    <View style={styles.detailTextContainer}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
      {subValue && <Text style={styles.detailSubValue}>{subValue}</Text>}
    </View>
  </View>
);

// ─── Helper: Checklist Item ──────────────────────────────────────────────────
const ChecklistItem = ({ label, isTrue, comment, badgeType }) => (
  <View style={styles.checklistItem}>
    <View style={styles.checklistRow}>
      <Text style={styles.checklistLabel}>{label}</Text>
      {badgeType === 'month' ? <MonthBadge isTrue={isTrue} /> : <StatusBadge isTrue={isTrue} />}
    </View>
    {comment && comment !== "N/A" && (
      <View style={styles.commentContainer}>
        <FontAwesome5 name="comment-dots" size={14} color="#555" />
        <Text style={styles.commentText}>{comment}</Text>
      </View>
    )}
  </View>
);

// ─── Helper: Reminder Call Note ───────────────────────────────────────────────
// Shown right under an attended session row when the reminder call for the
// *next* session has been marked as made. Only renders when `made` is true.
const ReminderCallNote = ({ made, nextOrdinal }) => {
  if (!made) return null;
  return (
    <View style={styles.reminderCallRow}>
      <FontAwesome5 name="phone-alt" size={11} color="#1565C0" />
      <Text style={styles.reminderCallText}>
        Reminder call made for {nextOrdinal} session
      </Text>
    </View>
  );
};

// ─── Helper: Section Header with optional Edit button ────────────────────────
const SectionHeader = ({ title, subtitle, canEdit, onEdit }) => (
  <View style={styles.sectionHeaderRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionHeader}>{title}</Text>
      {subtitle && <Text style={styles.dateText}>{subtitle}</Text>}
    </View>
    {canEdit && (
      <TouchableOpacity onPress={onEdit} style={styles.smallEditBtn}>
        <Ionicons name="create-outline" size={13} color="#fff" />
        <Text style={styles.smallEditText}>Edit</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Handle Call ─────────────────────────────────────────────────────────────
const handleCall = (phoneNumber) => {
  const url = `tel:${phoneNumber}`;
  Linking.canOpenURL(url)
    .then(supported => {
      if (!supported) {
        Alert.alert('Error', 'Phone calls are not supported on this device.');
      } else {
        return Linking.openURL(url);
      }
    })
    .catch(err => console.error('An error occurred', err));
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function SeekerProfileScreen() {
  const [seeker, setSeeker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingInterested, setSavingInterested] = useState(false);

  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // ── Role checks ────────────────────────────────────────────────────────────
  const userRoleId = parseInt(user?.role_id ?? user?.role?.id ?? 0, 10);
  const isPratishthanYuva        = userRoleId === 8;
  const isPratishthanCallingTeam = userRoleId === 9 || userRoleId === 10;
  const canEditChecklist  = user?.permissions?.includes(2);

  const copyToClipboard = async (number) => {
    if (!number) return;
    await Clipboard.setStringAsync(number);
    Alert.alert('Copied', 'Mobile number copied to clipboard', [{ text: 'OK' }], { cancelable: true });
  };

  const fetchSeeker = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/seekers/${id}`);
      setSeeker(response.data);
    } catch (error) {
      console.error("Error fetching seeker:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSeeker();
      return () => {};
    }, [id])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <>
          {user?.permissions?.includes(17) && (
            <View style={{ flexDirection: "row", alignItems: "center", marginRight: 15 }}>
              <TouchableOpacity
                onPress={() => router.push(`/seeker/edit/${id}`)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#007AFF",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  gap: 5,
                }}
              >
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ),
      title: "Seeker Details",
    });
  }, [navigation, id, router, user?.permissions]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  // ── Confirmation + Save for "Not Interested" ────────────────────────────────
  const handleNotInterestedPress = () => {
    const isCurrentlyInterested = seeker.interested_in_followup;

    // If already marked as Not Interested, confirm toggling back
    const title = isCurrentlyInterested
      ? "Mark as Not Interested?"
      : "Mark as Interested?";

    const message = isCurrentlyInterested
      ? `Are you sure you want to mark ${seeker.first_name} ${seeker.last_name} as NOT interested in Sahajayoga & follow-up?`
      : `Are you sure you want to mark ${seeker.first_name} ${seeker.last_name} as INTERESTED in Sahajayoga & follow-up?`;

    Alert.alert(
      title,
      message,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, Confirm",
          style: isCurrentlyInterested ? "destructive" : "default",
          onPress: () => saveInterestedStatus(!isCurrentlyInterested),
        },
      ],
      { cancelable: true }
    );
  };

  const saveInterestedStatus = async (newValue) => {
    setSavingInterested(true);
    try {
      await api.put(`/seekers/${id}`, { interested_in_followup: newValue });
      setSeeker(prev => ({ ...prev, interested_in_followup: newValue }));
    } catch (e) {
      Alert.alert("Error", "Could not update. Please try again.");
    } finally {
      setSavingInterested(false);
    }
  };

  // ── Loading / Error states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!seeker) {
    return (
      <View style={styles.loader}>
        <Text style={styles.noSeekerText}>No seeker found</Text>
      </View>
    );
  }

  const checklist = seeker.checklist || {};

  return (
    <View style={{ flex: 1, backgroundColor: "#F9F9F9" }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Main Profile Card ─────────────────────────────────────────────── */}
        <Text style={styles.title}>{seeker.first_name} {seeker.last_name}</Text>

        <View style={styles.card}>
          <View style={styles.containerRow}>
            <ProfileDetail
              iconName="business-outline"
              label="Type"
              value={seeker.type === 1 ? "Pratishthan Seeker" : "Public Program Seeker"}
            />
          </View>

          <View style={styles.containerRow}>
            {seeker.type === 2 && (
              <ProfileDetail
                iconName="map-outline"
                label="Location of Public Program"
                value={seeker.address || "N/A"}
              />
            )}
          </View>

          <View style={styles.separator} />

          {/* Mobile Row */}
          <View style={styles.mobileRow}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => handleCall(seeker.mobile)}>
              <ProfileDetail iconName="call-outline" label="Mobile" value={seeker.mobile} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => copyToClipboard(seeker.mobile)}
              style={styles.copyButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="copy-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <ProfileDetail iconName="body-outline" label="Gender" value={seeker.sex || "N/A"} />
          <ProfileDetail iconName="calendar-outline" label="Age range" value={seeker.age_range + " (years)" || "N/A"} />
          <ProfileDetail iconName="location-outline" label="Area of Residence" value={seeker.area?.name || "N/A"} />
          <ProfileDetail iconName="map-outline" label="Zone" value={seeker.zone?.name || "N/A"} />

          <View style={styles.separator} />

          <ProfileDetail
            iconName="person-outline"
            label="Caller Name (Calling Team)"
            value={seeker.caller ? seeker.caller.name : 'Caller not assigned'}
            subValue={seeker.caller && seeker.called_at
              ? `Called on ${new Date(seeker.called_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : null}
          />
          <ProfileDetail
            iconName="reader-outline"
            label="Comments by Calling Team"
            value={seeker.comment || "N/A"}
          />

          <View style={styles.separator} />

          <ProfileDetail
            iconName="person-circle-outline"
            label="Mentor Name"
            value={seeker.moderator ? seeker.moderator.name : 'Mentor not assigned'}
          />

          <View style={styles.separator} />

          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>Created Date: {formatDate(seeker.created_at)}</Text>
            <Text style={styles.dateText}>- By: {seeker.creator?.name} ({seeker.creator?.zone?.name})</Text>
            <Text style={styles.dateText}>Last Updated: {formatDate(seeker.updated_at)}</Text>
            <Text style={styles.dateText}>- By: {seeker.lastupdator?.name} ({seeker.lastupdator?.role?.name})</Text>
          </View>
        </View>

        {/* Pratishthan Yuva / Calling Team: only see sessions */}
        {(isPratishthanYuva || isPratishthanCallingTeam) && seeker.type === 1 && (
          <>
            <SectionHeader
              title="🧘 Pratishthan Session Updates"
              subtitle="(Reminder call status is shown after each attended session)"
              canEdit={canEditChecklist}
              onEdit={() => router.push(`/seeker/checklist/${id}?name=${seeker.first_name}&module=sessions`)}
            />
            <View style={styles.checklistCard}>
              <ChecklistItem label="Attended 1st Session" isTrue={checklist.attended_session_1} />
              <ReminderCallNote made={checklist.session_1_call_made} nextOrdinal={getOrdinal(2)} />
              <ChecklistItem label="Attended 2nd Session" isTrue={checklist.attended_session_2} />
              <ReminderCallNote made={checklist.session_2_call_made} nextOrdinal={getOrdinal(3)} />
              <ChecklistItem label="Attended 3rd Session" isTrue={checklist.attended_session_3} />
              <ReminderCallNote made={checklist.session_3_call_made} nextOrdinal={getOrdinal(4)} />
              <ChecklistItem label="Attended 4th Session" isTrue={checklist.attended_session_4} />
            </View>
          </>
        )}

        {/* Mentor / Admin / Zonal Leader: see all modules */}
        {!isPratishthanYuva && !isPratishthanCallingTeam && (
          <>
            {/* Pratishthan Sessions — view only */}
            {seeker.type === 1 && (
              <>
                <SectionHeader
                  title="🧘 Pratishthan Session Updates"
                  subtitle="(Reminder call status is shown after each attended session)"
                  canEdit={false}
                />
                <View style={styles.checklistCard}>
                  <ChecklistItem label="Attended 1st Session" isTrue={checklist.attended_session_1} />
                  <ReminderCallNote made={checklist.session_1_call_made} nextOrdinal={getOrdinal(2)} />
                  <ChecklistItem label="Attended 2nd Session" isTrue={checklist.attended_session_2} />
                  <ReminderCallNote made={checklist.session_2_call_made} nextOrdinal={getOrdinal(3)} />
                  <ChecklistItem label="Attended 3rd Session" isTrue={checklist.attended_session_3} />
                  <ReminderCallNote made={checklist.session_3_call_made} nextOrdinal={getOrdinal(4)} />
                  <ChecklistItem label="Attended 4th Session" isTrue={checklist.attended_session_4} />
                </View>
              </>
            )}

            {/* Follow-up Guidelines */}
            <SectionHeader
              title="✅ Follow-up Checklist"
              subtitle="(Please update below checklist time to time after discussions with the new seeker)"
              canEdit={canEditChecklist}
              onEdit={() => router.push(`/seeker/checklist/${id}?name=${seeker.first_name}&module=followup`)}
            />
            <View style={styles.checklistCardSecondary}>
              <ChecklistItem label="Is the seeker Feeling Vibrations?" isTrue={checklist.feeling_vibrations} />
              <ChecklistItem label="Is the seeker Meditating at Home?" isTrue={checklist.meditating_at_home} />
              <ChecklistItem label="Is the seeker doing Footsoak at Home?" isTrue={checklist.footsoak_at_home} />
              <ChecklistItem label="Does the seeker has Shri Mataji's Photo at Home?" isTrue={checklist.photo_at_home} />
              <ChecklistItem label="Is the seeker Attending Center?" isTrue={checklist.attended_centres} />
              <ChecklistItem label="Has the seeker Attended any Seminar" isTrue={checklist.attended_seminar} />
            </View>

            {/* Monthly Follow-up */}
            <SectionHeader
              title="🗓️ Monthly Follow-up Updates"
              subtitle="(After every month please write your observations below)"
              canEdit={canEditChecklist}
              onEdit={() => router.push(`/seeker/checklist/${id}?name=${seeker.first_name}&module=monthly`)}
            />
            <View style={styles.checklistCardSecondary}>
              <ChecklistItem label="Review after 1st Month" isTrue={checklist.month_1} comment={checklist.month_1_comments} badgeType="month" />
              <ChecklistItem label="Review after 2nd Month" isTrue={checklist.month_2} comment={checklist.month_2_comments} badgeType="month" />
              <ChecklistItem label="Review after 3rd Month" isTrue={checklist.month_3} comment={checklist.month_3_comments} badgeType="month" />
              <ChecklistItem label="Review after 4th Month" isTrue={checklist.month_4} comment={checklist.month_4_comments} badgeType="month" />
            </View>

            {/* After 4th Month Review */}
            <Text style={styles.sectionHeader}>🗓️ After 4th Months Review</Text>
            <View style={styles.checklistCardSecondary}>
              <ChecklistItem label="Has He/She become a Sahajayogi?" isTrue={checklist.established} />
            </View>

            {/* Not Interested in Sahajayoga */}
            <View style={styles.followUpContainer}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.followUpLabel}>Mark the seeker Not Interested in Sahajayoga</Text>
                {!seeker.interested_in_followup ? (
                  <View style={styles.notInterestedStatusRow}>
                    <Ionicons name="close-circle" size={15} color="#C62828" />
                    <Text style={styles.notInterestedStatusText}>
                      Marked as Not Interested by Mentor
                    </Text>
                  </View>
                ) : (
                  <View style={styles.interestedStatusRow}>
                    <Ionicons name="checkmark-circle" size={15} color="#2E7D32" />
                    <Text style={styles.interestedStatusText}>
                      Interested in Sahajayoga
                    </Text>
                  </View>
                )}
              </View>

              {canEditChecklist && (
                <TouchableOpacity
                  onPress={handleNotInterestedPress}
                  disabled={savingInterested}
                  style={[
                    styles.notInterestedBtn,
                    !seeker.interested_in_followup && styles.notInterestedBtnReverse,
                    savingInterested && { opacity: 0.6 },
                  ]}
                >
                  {savingInterested ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name={seeker.interested_in_followup ? "close-circle-outline" : "checkmark-circle-outline"}
                        size={15}
                        color="#fff"
                      />
                      <Text style={styles.notInterestedBtnText}>Submit</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 20, backgroundColor: "#F9F9F9" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  noSeekerText: { fontSize: 18, color: "#555" },

  title: { fontSize: 18, fontWeight: "bold", color: "#1A237E", marginBottom: 15 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  detailIcon: { marginRight: 15, width: 20 },
  detailLabel: { fontSize: 14, fontWeight: "500", color: "#616161" },
  detailValue: { fontSize: 16, color: "#212121", marginTop: 2, fontWeight: "600" },
  detailSubValue: { fontSize: 11, color: '#9E9E9E', marginTop: 1 },
  detailTextContainer: {},

  separator: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 10 },

  dateInfo: {},
  dateText: { fontSize: 13, color: "#757575", marginBottom: 4 },
  dateText1: { fontSize: 15, color: "#757575", marginBottom: 4 },

  containerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  mobileRow: { flexDirection: "row", alignItems: "center" },
  copyButton: { paddingHorizontal: 12, paddingVertical: 8, justifyContent: "center", alignItems: "center" },
  mobileNumber: { color: '#007AFF', textDecorationLine: 'underline' },

  // ── Follow-up Container ──────────────────────────────────────────────────────
  followUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#FFFDE7',
    borderRadius: 10,
    marginBottom: 14,
    borderLeftWidth: 5,
    borderLeftColor: '#FFC107',
  },
  followUpLabel: { fontSize: 15, fontWeight: '600', color: '#333' },

  // ── Not Interested Status Text ───────────────────────────────────────────────
  notInterestedStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  notInterestedStatusText: {
    fontSize: 13,
    color: '#C62828',
    fontWeight: '600',
    fontStyle: 'italic',
    flexShrink: 1,
  },
  interestedStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  interestedStatusText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
    fontStyle: 'italic',
    flexShrink: 1,
  },

  // ── Not Interested Button ────────────────────────────────────────────────────
  notInterestedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
    minWidth: 80,
    justifyContent: 'center',
  },
  notInterestedBtnReverse: {
    backgroundColor: '#388E3C',
  },
  notInterestedBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // ── Section Header Row ───────────────────────────────────────────────────────
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#424242",
  },

  // ── Small Edit Button ────────────────────────────────────────────────────────
  smallEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
    marginLeft: 8,
  },
  smallEditText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // ── Checklist Cards ──────────────────────────────────────────────────────────
  checklistCard: {
    backgroundColor: "#E8F5E9",
    borderRadius: 14,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
  },
  checklistCardSecondary: {
    backgroundColor: "#E3F2FD",
    borderRadius: 14,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
  },
  checklistItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CFD8DC',
  },
  checklistRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checklistLabel: { fontSize: 15, color: '#333', fontWeight: '500', flexShrink: 1, marginRight: 10 },

  // ── Status Badge ─────────────────────────────────────────────────────────────
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15, minWidth: 50, alignItems: 'center' },
  statusYes: { backgroundColor: "#4CAF50" },
  statusNo: { backgroundColor: "#F44336" },
  statusPending: { backgroundColor: "#9E9E9E" },
  badgeText: { color: "#fff", fontWeight: "bold", fontSize: 12 },

  // ── Comment ──────────────────────────────────────────────────────────────────
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CFD8DC',
    marginLeft: 5,
    paddingLeft: 5,
  },
  commentText: { fontSize: 13, color: '#555', marginLeft: 8, fontStyle: 'italic', flexShrink: 1 },

  // ── Reminder Call Note ────────────────────────────────────────────────────────
  reminderCallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginLeft: 8,
    marginBottom: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
  },
  reminderCallText: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: '600',
  },
});