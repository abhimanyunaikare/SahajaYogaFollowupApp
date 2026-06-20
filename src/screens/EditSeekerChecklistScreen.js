import React, { useState, useEffect, useCallback, useLayoutEffect, useContext } from "react";
import {
  View, Text, TextInput, ScrollView, Switch, Alert, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import api from "../api/apiClient";
import { FontAwesome5 } from '@expo/vector-icons';
import { AuthContext } from "../../src/context/AuthContext";

// ─── Role IDs (match your DB roles table) ────────────────────────────────────
const ROLE_PRATISHTHAN_YUVA          = 8;
const ROLE_PRATISHTHAN_CALLING_TEAM  = 9;
const ROLE_PRATISHTHAN_CALLING_COORD = 10;

// ─── Ordinal helper ──────────────────────────────────────────────────────────
const getOrdinal = (n) => ['1st', '2nd', '3rd', '4th'][n - 1] ?? `${n}th`;

// ─── ChecklistSwitch ─────────────────────────────────────────────────────────
const ChecklistSwitch = ({ label, value, onChange, isLast, disabled }) => (
  <View style={[styles.switchRow, isLast && styles.noBorder, disabled && styles.disabledRow]}>
    <Text style={[styles.switchLabel, disabled && styles.disabledText]}>{label}</Text>
    <Switch
      value={value ?? false}
      onValueChange={disabled ? undefined : onChange}
      disabled={disabled}
      thumbColor={value ? "#007AFF" : "#F5F5F5"}
      trackColor={{ false: "#D1D1D6", true: "#A0C8F9" }}
    />
  </View>
);

// ─── SwitchAndComment ─────────────────────────────────────────────────────────
// NOTE: still used for the Monthly Follow-up section below. Left untouched.
const SwitchAndComment = ({ label, switchValue, onSwitchChange, commentValue, onCommentChange, ordinal, isLast }) => (
  <View style={[styles.groupContainer, isLast && { marginBottom: 0 }]}>
    <ChecklistSwitch label={label} value={switchValue} onChange={onSwitchChange} />
    <TextInput
      style={styles.commentInput}
      placeholder={`${ordinal} session comments (Optional)`}
      placeholderTextColor="#A0A0A0"
      value={commentValue || ""}
      onChangeText={onCommentChange}
      multiline
      numberOfLines={3}
    />
  </View>
);

// ─── CallingTeamSessionRow ────────────────────────────────────────────────────
const CallingTeamSessionRow = ({ sessionNumber, attended, callMadeValue, onCallMadeChange, commentValue, onCommentChange, isLast }) => {
  const nextSession = sessionNumber + 1;
  const hasNextSession = nextSession <= 4;

  return (
    <View style={[styles.sessionBlock, isLast && { marginBottom: 0 }]}>
      <View style={styles.sessionBlockHeader}>
        <FontAwesome5
          name={attended ? "check-circle" : "circle"}
          size={14}
          color={attended ? "#4CAF50" : "#9E9E9E"}
        />
        <Text style={styles.sessionBlockTitle}>
          {getOrdinal(sessionNumber)} Session
          {"  "}
          <Text style={[styles.sessionAttendedBadge, { color: attended ? "#4CAF50" : "#F44336" }]}>
            {attended ? "✔ Attended" : "✘ Not Yet"}
          </Text>
        </Text>
      </View>

      {attended && hasNextSession ? (
        <View style={styles.callBlock}>
          <ChecklistSwitch
            label={`📞 Reminder call made for ${getOrdinal(nextSession)} session`}
            value={callMadeValue}
            onChange={onCallMadeChange}
          />
          {/* Comments disabled for session reminder calls — not needed for now.
          <TextInput
            style={styles.commentInput}
            placeholder={`Notes for ${getOrdinal(nextSession)} session call (Optional)`}
            placeholderTextColor="#A0A0A0"
            value={commentValue || ""}
            onChangeText={onCommentChange}
            multiline
            numberOfLines={3}
          />
          */}
        </View>
      ) : attended && !hasNextSession ? (
        <View style={styles.completionNote}>
          <FontAwesome5 name="award" size={14} color="#FF9800" />
          <Text style={styles.completionNoteText}>All 4 sessions completed! 🎉</Text>
        </View>
      ) : (
        <Text style={styles.waitingNote}>
          ⏳ Awaiting attendance — call reminder will appear here after session is marked attended.
        </Text>
      )}
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function EditChecklistScreen() {
  const { id, name, module } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  const userRoleId = parseInt(user?.role_id ?? user?.role?.id ?? 0, 10);

  const isPratishthanYuva    = userRoleId === ROLE_PRATISHTHAN_YUVA;
  const isPratishthanCalling = userRoleId === ROLE_PRATISHTHAN_CALLING_TEAM
                            || userRoleId === ROLE_PRATISHTHAN_CALLING_COORD;

  // ── Module visibility ──────────────────────────────────────────────────────
  // module=sessions  → Pratishthan sessions only
  // module=followup  → General checklist + monthly + 4th month review
  // module=monthly   → Monthly follow-up section only
  // (no module)      → role-based default
  const showSessions = module === 'sessions' || (!module && (isPratishthanYuva || isPratishthanCalling));
  const showFollowup = module === 'followup' || (!module && !isPratishthanYuva && !isPratishthanCalling);
  const showMonthly  = module === 'monthly';

  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState({});

  const allMonthsAttended =
    checklist.month_1 && checklist.month_2 &&
    checklist.month_3 && checklist.month_4;

  const handleChange = (key, value) => {
    setChecklist(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const fetchChecklist = async () => {
      try {
        const response = await api.get(`/seekers/${id}/checklist`);
        const data = response.data || {};
        const normalized = Object.fromEntries(
          Object.entries(data).map(([key, value]) => [
            key,
            value === 1 ? true : value === 0 ? false : value ?? ""
          ])
        );
        setChecklist(prev => ({ ...prev, ...normalized }));
      } catch (error) {
        console.error(error.response?.data || error.message);
        Alert.alert("Error", "Failed to load checklist");
      } finally {
        setLoading(false);
      }
    };
    fetchChecklist();
  }, [id]);

  const handleSave = useCallback(async () => {
    Keyboard.dismiss();
    try {
      await api.put(`/seekers/${id}/checklist`, checklist);
      Alert.alert("Success", "Checklist updated successfully!");
      router.back();
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert("Error", "Failed to update checklist");
    }
  }, [id, checklist, router]);

  // ── Screen title per module ────────────────────────────────────────────────
  const screenTitle = module === 'monthly'
    ? `${name}'s Monthly Follow-up`
    : `Edit ${name}'s Checklist`;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: screenTitle,
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Save</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleSave, screenTitle]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#F2F2F7" }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 150 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── PRATISHTHAN SESSIONS ─────────────────────────────────────────── */}
        {showSessions && (
          <View style={styles.cardPratishthan}>
            <Text style={styles.sectionTitle}>
              <FontAwesome5 name="seedling" size={16} color="#007AFF" />
              {"  "}PRATISHTHAN SESSIONS
            </Text>

            {isPratishthanYuva && (
              <>
                <Text style={styles.roleNote}>
                  👤 Mark attendance for each session attended.
                </Text>
                {[1, 2, 3, 4].map((n) => (
                  <ChecklistSwitch
                    key={`session-${n}`}
                    label={`Attended ${getOrdinal(n)} Session`}
                    value={checklist[`attended_session_${n}`]}
                    onChange={(val) => handleChange(`attended_session_${n}`, val)}
                    isLast={n === 4}
                  />
                ))}
              </>
            )}

            {isPratishthanCalling && (
              <>
                <Text style={styles.roleNote}>
                  📞 After each session is attended, mark your reminder call for the next session.
                </Text>
                {[1, 2, 3, 4].map((n) => (
                  <CallingTeamSessionRow
                    key={`session-${n}`}
                    sessionNumber={n}
                    attended={checklist[`attended_session_${n}`]}
                    callMadeValue={checklist[`session_${n}_call_made`]}
                    onCallMadeChange={(val) => handleChange(`session_${n}_call_made`, val)}
                    commentValue={checklist[`session_${n}_comments`]}
                    onCommentChange={(text) => handleChange(`session_${n}_comments`, text)}
                    isLast={n === 4}
                  />
                ))}
              </>
            )}

            {!isPratishthanYuva && !isPratishthanCalling && (
              <>
                {/* Comments disabled for sessions — was using SwitchAndComment:
                {[1, 2, 3, 4].map((n) => (
                  <SwitchAndComment
                    key={`session-${n}`}
                    label={`Attended ${getOrdinal(n)} Session`}
                    ordinal={getOrdinal(n)}
                    switchValue={checklist[`attended_session_${n}`]}
                    onSwitchChange={(val) => handleChange(`attended_session_${n}`, val)}
                    commentValue={checklist[`session_${n}_comments`]}
                    onCommentChange={(text) => handleChange(`session_${n}_comments`, text)}
                    isLast={n === 4}
                  />
                ))}
                */}
                {[1, 2, 3, 4].map((n) => (
                  <ChecklistSwitch
                    key={`session-${n}`}
                    label={`Attended ${getOrdinal(n)} Session`}
                    value={checklist[`attended_session_${n}`]}
                    onChange={(val) => handleChange(`attended_session_${n}`, val)}
                    isLast={n === 4}
                  />
                ))}
              </>
            )}
          </View>
        )}

        {/* ── GENERAL CHECKLIST ONLY (module=followup) ─────────────────────── */}
        {showFollowup && (
          <View style={styles.cardFollowUp}>
            <Text style={styles.sectionTitle}>
              <FontAwesome5 name="list-ul" size={16} color="#2ECC71" />
              {"  "}GENERAL CHECKLIST (Mentors)
            </Text>
            <ChecklistSwitch label="Is the seeker Feeling Vibrations?"                  value={checklist.feeling_vibrations}   onChange={(val) => handleChange("feeling_vibrations", val)} />
            <ChecklistSwitch label="Is the seeker Meditating at Home?"                  value={checklist.meditating_at_home}   onChange={(val) => handleChange("meditating_at_home", val)} />
            <ChecklistSwitch label="Is the seeker doing Footsoak at Home?"              value={checklist.footsoak_at_home}     onChange={(val) => handleChange("footsoak_at_home", val)} />
            <ChecklistSwitch label="Does the seeker have Shri Mataji's Photo at Home?"  value={checklist.photo_at_home}        onChange={(val) => handleChange("photo_at_home", val)} />
            <ChecklistSwitch label="Check Puja arranged at Home"                        value={checklist.alter_check_at_home}  onChange={(val) => handleChange("alter_check_at_home", val)} />
            <ChecklistSwitch label="Is the seeker Attending Center?"                    value={checklist.attended_centres}     onChange={(val) => handleChange("attended_centres", val)} />
            <ChecklistSwitch label="Has the seeker Attended any Seminar?"               value={checklist.attended_seminar}     onChange={(val) => handleChange("attended_seminar", val)} />
            <ChecklistSwitch label="Has the seeker Attended any Puja?"                  value={checklist.attended_puja}        onChange={(val) => handleChange("attended_puja", val)} isLast />
          </View>
        )}

        {/* ── MONTHLY FOLLOW-UP + 4TH MONTH REVIEW (module=monthly) ───────── */}
        {showMonthly && (
          <>
            <View style={styles.cardFollowUp}>
              <Text style={styles.sectionTitle}>
                <FontAwesome5 name="calendar-alt" size={16} color="#E67E22" />
                {"  "}MONTHLY FOLLOW-UP (Mentors)
              </Text>
              <Text style={styles.roleNote}>
                🗓️ After every month, mark attendance and write your observations below.
              </Text>
              {[1, 2, 3, 4].map((n, index) => (
                <SwitchAndComment
                  key={`month-${n}`}
                  label={`Review after ${getOrdinal(n)} Month`}
                  ordinal={getOrdinal(n)}
                  switchValue={checklist[`month_${n}`]}
                  onSwitchChange={(val) => handleChange(`month_${n}`, val)}
                  commentValue={checklist[`month_${n}_comments`]}
                  onCommentChange={(text) => handleChange(`month_${n}_comments`, text)}
                  isLast={index === 3}
                />
              ))}
            </View>

            <View style={styles.cardFollowUp}>
              <Text style={styles.sectionTitle}>
                <FontAwesome5 name="calendar-check" size={16} color="#E67E22" />
                {"  "}FINAL REVIEW — After 4 Months
              </Text>
              <View style={{ opacity: allMonthsAttended ? 1 : 0.5 }}>
                <ChecklistSwitch
                  label="Has He/She become a Sahajayogi?"
                  value={allMonthsAttended ? checklist.established : false}
                  onChange={(val) => handleChange("established", val)}
                  disabled={!allMonthsAttended}
                  isLast
                />
                {!allMonthsAttended && (
                  <Text style={styles.warningText}>
                    * Complete all 4 monthly reviews above to unlock this section.
                  </Text>
                )}
              </View>
            </View>
          </>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, padding: 10 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  cardPratishthan: {
    backgroundColor: "#EBF5FF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#D0E6FF',
  },
  cardFollowUp: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
    color: "#333",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
  },
  roleNote: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
    fontStyle: 'italic',
    backgroundColor: '#FFF9C4',
    padding: 8,
    borderRadius: 6,
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D1D1D6",
  },
  noBorder: { borderBottomWidth: 0 },
  disabledRow: { opacity: 0.5 },
  switchLabel: { fontSize: 15, color: "#2C2C2E", fontWeight: '400', flex: 1, marginRight: 10 },
  disabledText: { color: '#999' },

  groupContainer: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  commentInput: {
    backgroundColor: "#F9F9F9",
    padding: 10,
    paddingTop: 10,
    fontSize: 14,
    color: "#4A4A4A",
    borderTopWidth: 1,
    borderTopColor: '#D1D1D6',
    minHeight: 70,
    textAlignVertical: 'top',
  },

  sessionBlock: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C8DEF5',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F0F7FF',
  },
  sessionBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#D6EAFF',
    borderBottomWidth: 1,
    borderBottomColor: '#C8DEF5',
  },
  sessionBlockTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A237E',
  },
  sessionAttendedBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  callBlock: {},
  waitingNote: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    padding: 10,
  },
  completionNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  completionNoteText: {
    fontSize: 13,
    color: '#FF9800',
    fontWeight: '600',
  },

  warningText: { fontSize: 12, color: 'red', marginLeft: 5, marginTop: 5, marginBottom: 4 },

  headerButton: { marginRight: 10, paddingVertical: 5, paddingHorizontal: 10 },
  headerButtonText: { color: "#007AFF", fontSize: 16, fontWeight: "600" },
});