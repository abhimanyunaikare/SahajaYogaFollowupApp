// MyAssignmentsTab.jsx
// Add this as a tab/section inside your existing seeker list screen.
// Shows current week's assigned seekers for the logged-in calling team member.
// Each row shows seeker info + call status update buttons.

import React, { useState, useCallback, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Linking, RefreshControl
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import api from "../../src/api/apiClient";

const getOrdinal = (n) => ['1st', '2nd', '3rd', '4th'][n - 1] ?? `${n}th`;

const STATUS_CONFIG = {
  pending:      { label: 'Pending',      color: '#FF9800', bg: '#FFF3E0', icon: 'time-outline' },
  called:       { label: 'Called ✓',     color: '#4CAF50', bg: '#E8F5E9', icon: 'checkmark-circle-outline' },
  no_answer:    { label: 'No Answer',    color: '#F44336', bg: '#FFEBEE', icon: 'close-circle-outline' },
  not_required: { label: 'Not Required', color: '#9E9E9E', bg: '#F5F5F5', icon: 'remove-circle-outline' },
};

// ── Status Picker ─────────────────────────────────────────────────────────────
const StatusPicker = ({ currentStatus, onSelect }) => (
  <View style={styles.statusPicker}>
    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
      <TouchableOpacity
        key={key}
        style={[styles.statusOption, { backgroundColor: cfg.bg, borderColor: currentStatus === key ? cfg.color : 'transparent', borderWidth: 2 }]}
        onPress={() => onSelect(key)}
      >
        <Ionicons name={cfg.icon} size={14} color={cfg.color} />
        <Text style={[styles.statusOptionText, { color: cfg.color }]}>{cfg.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ── Assignment Card ────────────────────────────────────────────────────────────
const AssignmentCard = ({ item, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
  const router = useRouter();

  const handleCall = () => {
    Linking.openURL(`tel:${item.mobile}`).catch(() =>
      Alert.alert('Error', 'Could not make call')
    );
  };

  return (
    <View style={styles.card}>
      {/* ── Header row ────────────────────────────────────────────────────── */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.seekerName}>{item.name}</Text>
          <Text style={styles.seekerMeta}>{item.area} · {item.zone}</Text>
          <View style={styles.sessionBadge}>
            <FontAwesome5 name="seedling" size={11} color="#007AFF" />
            <Text style={styles.sessionBadgeText}>
              Call for {getOrdinal(item.for_session)} session
            </Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          {/* Call button */}
          <TouchableOpacity onPress={handleCall} style={styles.callBtn}>
            <Ionicons name="call" size={18} color="#fff" />
          </TouchableOpacity>
          {/* View profile */}
          <TouchableOpacity
            onPress={() => router.push(`/seeker/${item.seeker_id}`)}
            style={styles.viewBtn}
          >
            <Ionicons name="eye-outline" size={18} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Status badge + expand ─────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.statusBadge, { backgroundColor: cfg.bg }]}
        onPress={() => setExpanded(e => !e)}
      >
        <Ionicons name={cfg.icon} size={14} color={cfg.color} />
        <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14} color={cfg.color}
          style={{ marginLeft: 'auto' }}
        />
      </TouchableOpacity>

      {/* ── Status picker (expanded) ──────────────────────────────────────── */}
      {expanded && (
        <StatusPicker
          currentStatus={item.status}
          onSelect={(newStatus) => {
            setExpanded(false);
            onStatusChange(item.assignment_id, newStatus);
          }}
        />
      )}
    </View>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function MyAssignmentsTab() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [weekStart, setWeekStart]     = useState('');

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/distribution/my-assignments');
      setAssignments(res.data.assignments);
      setWeekStart(res.data.week_start);
    } catch (e) {
      console.error('Failed to fetch assignments', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAssignments(); }, []));

  const handleStatusChange = async (assignmentId, newStatus) => {
    // Optimistic update
    setAssignments(prev =>
      prev.map(a => a.assignment_id === assignmentId ? { ...a, status: newStatus } : a)
    );
    try {
      await api.patch(`/distribution/assignments/${assignmentId}`, { status: newStatus });
    } catch (e) {
      Alert.alert('Error', 'Could not update status. Please try again.');
      fetchAssignments(); // revert on failure
    }
  };

  const pendingCount = assignments.filter(a => a.status === 'pending').length;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      {/* ── Week header ───────────────────────────────────────────────────── */}
      <View style={styles.weekHeader}>
        <View>
          <Text style={styles.weekTitle}>📋 My Assignments</Text>
          <Text style={styles.weekSubtitle}>
            Week of {weekStart ? new Date(weekStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
          </Text>
        </View>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingCount} pending</Text>
          </View>
        )}
      </View>

      {assignments.length === 0 ? (
        <View style={styles.centered}>
          <FontAwesome5 name="inbox" size={40} color="#BDBDBD" />
          <Text style={styles.emptyText}>No assignments this week</Text>
          <Text style={styles.emptySubText}>Check back after Thursday night distribution</Text>
        </View>
      ) : (
        <FlatList
          data={assignments}
          keyExtractor={item => String(item.assignment_id)}
          renderItem={({ item }) => (
            <AssignmentCard item={item} onStatusChange={handleStatusChange} />
          )}
          contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAssignments(); }} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#9E9E9E', marginTop: 12 },
  emptySubText: { fontSize: 13, color: '#BDBDBD' },

  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  weekTitle:    { fontSize: 16, fontWeight: '700', color: '#1A237E' },
  weekSubtitle: { fontSize: 13, color: '#757575', marginTop: 2 },
  pendingBadge: { backgroundColor: '#FF9800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pendingBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'flex-start',
  },
  seekerName:   { fontSize: 15, fontWeight: '700', color: '#212121' },
  seekerMeta:   { fontSize: 12, color: '#757575', marginTop: 2 },
  sessionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  sessionBadgeText: { fontSize: 12, color: '#007AFF', fontWeight: '600' },

  cardActions:  { flexDirection: 'row', gap: 8, alignItems: 'center' },
  callBtn: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 8,
  },
  viewBtn: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 8,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
  },
  statusBadgeText: { fontSize: 13, fontWeight: '600' },

  statusPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    backgroundColor: '#FAFAFA',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEEEEE',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusOptionText: { fontSize: 12, fontWeight: '600' },
});