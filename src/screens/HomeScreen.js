import React, { useEffect, useState, useContext, useCallback } from "react";
import { 
    View, Text, Alert, TouchableOpacity, StyleSheet, 
    FlatList, ActivityIndicator, Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import { AuthContext } from "../../src/context/AuthContext";
import api from "../api/apiClient";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY_COLOR     = "#007AFF"; 
const SECONDARY_COLOR   = "#2196F3"; 
const BACKGROUND_COLOR  = "#FFFFFF"; 
const TEXT_COLOR        = "#212121";
const SUBTLE_TEXT_COLOR = "#757575";
const NUM_COLUMNS       = 3;

const PRATISHTHAN_CALLING_ROLES = [9, 10];

const PERMISSIONS = {
  ADD_SEEKER:    1,
  USERS:         3,
  ROLES:         5,
  REPORTS:       7,
  CCT:           9,
  ZONAL:         10,
  MENTOR:        11,
  ZONE:          12,
  AREA:          13,
  SESSIONS:      15,
  SUCCESS:       16,
  NONINTERESTED: 18,
  CCRUSER:       19,
  ALLSEEKERS:    20,
};

// ─── Availability Banner (roles 9 & 10 only) ─────────────────────────────────
const AvailabilityBanner = () => {
  const [isAvailable, setIsAvailable] = useState(true);
  const [toggledAt, setToggledAt]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/calling-team/availability');
        setIsAvailable(res.data.is_available);
        setToggledAt(res.data.toggled_at);
      } catch (e) {
        console.error('Availability fetch failed', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleToggle = async () => {
    setSaving(true);
    const prev = isAvailable;
    setIsAvailable(!prev); // optimistic
    try {
      const res = await api.post('/calling-team/availability/toggle');
      setIsAvailable(res.data.is_available);
      setToggledAt(res.data.toggled_at);
    } catch (e) {
      setIsAvailable(prev); // revert
      Alert.alert('Error', 'Could not update availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dt) => {
    if (!dt) return '';
    return new Date(dt).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.availabilityCard}>
        <ActivityIndicator size="small" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <View style={[styles.availabilityCard, isAvailable ? styles.availabilityCardOn : styles.availabilityCardOff]}>
      <View style={styles.availabilityLeft}>
        <View style={[styles.availabilityIconWrap, { backgroundColor: isAvailable ? '#C8E6C9' : '#FFCDD2' }]}>
          <Ionicons
            name={isAvailable ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={isAvailable ? '#4CAF50' : '#F44336'}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.availabilityTitle}>Availability Status</Text>
          <Text style={[styles.availabilityStatus, { color: isAvailable ? '#4CAF50' : '#F44336' }]}>
            {isAvailable ? '🟢 Available for calling' : '🔴 Unavailable for calling'}
          </Text>
          {toggledAt && (
            <Text style={styles.availabilityMeta}>Changed: {formatDate(toggledAt)}</Text>
          )}
        </View>
      </View>
      <View style={styles.availabilityRight}>
        {saving
          ? <ActivityIndicator size="small" color={PRIMARY_COLOR} />
          : <Switch
              value={isAvailable}
              onValueChange={handleToggle}
              thumbColor={isAvailable ? '#4CAF50' : '#EF9A9A'}
              trackColor={{ false: '#FFCDD2', true: '#C8E6C9' }}
            />
        }
      </View>
    </View>
  );
};

// ─── Distribution Banner (role 10 coordinator only) ──────────────────────────
const DistributionBanner = () => {
  const [running, setRunning]   = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleRun = () => {
    Alert.alert(
      'Run Distribution',
      'This will assign this week\'s Pratishthan session attendees to available calling team members. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run Now',
          style: 'default',
          onPress: async () => {
            setRunning(true);
            setLastResult(null);
            try {
              const res = await api.post('/distribution/run');
              setLastResult(res.data);
              if (res.data.assigned > 0) {
                Alert.alert(
                  '✅ Distribution Complete',
                  `${res.data.assigned} seeker(s) assigned to calling team members.`
                );
              } else {
                Alert.alert(
                  'ℹ️ Nothing to Assign',
                  res.data.reason ?? 'No seekers found for this week.'
                );
              }
            } catch (e) {
              Alert.alert('Error', 'Distribution failed. Please try again.');
              console.error('Distribution error:', e.message);
            } finally {
              setRunning(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.distributionCard}>
      <View style={styles.distributionLeft}>
        <View style={styles.distributionIconWrap}>
          <Ionicons name="shuffle-outline" size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.distributionTitle}>Seeker Distribution</Text>
          <Text style={styles.distributionSubtitle}>
            {lastResult
              ? lastResult.assigned > 0
                ? `Last run: ${lastResult.assigned} assigned`
                : `Last run: ${lastResult.reason ?? 'Nothing to assign'}`
              : 'Auto-runs Tuesday night. Tap to run manually.'
            }
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.distributionBtn, running && { opacity: 0.6 }]}
        onPress={handleRun}
        disabled={running}
      >
        {running
          ? <ActivityIndicator size="small" color="#fff" />
          : <>
              <Ionicons name="play-circle-outline" size={16} color="#fff" />
              <Text style={styles.distributionBtnText}>Run</Text>
            </>
        }
      </TouchableOpacity>
    </View>
  );
};

// ─── Home Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
    const [stats, setStats]           = useState(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false); 
    const [error, setError]           = useState(null); 
    const router = useRouter();
    const { user, loading, logout, validateUserSession } = useContext(AuthContext);

    const userRoleId           = parseInt(user?.role_id ?? 0, 10);
    const isPratishthanCalling = PRATISHTHAN_CALLING_ROLES.includes(userRoleId);
    const isCoordinator        = userRoleId === 10; // Only coordinator sees Run Distribution

    const fetchStats = useCallback(async () => {
        if (userRoleId !== 1 && userRoleId !== 2) return;
        setIsLoadingStats(true);
        setError(null);
        try {
            const response = await api.get("/dashboard/stats");
            setStats(response.data);
        } catch (err) {
            setError("Failed to load dashboard statistics.");
        } finally {
            setIsLoadingStats(false);
        }
    }, [userRoleId]);

    useEffect(() => {
        const checkSecurity = async () => {
            if (user && !loading) {
                const isValid = await validateUserSession(user); 
                if (isValid) {
                    fetchStats();
                } else {
                    router.replace("/login"); 
                }
            }
        };
        checkSecurity();
    }, [user?.role_id, loading]);

    const menuItems = [
      { id: "1",  title: "New Seekers List",            icon: "people",                color: PRIMARY_COLOR,   route: "/seekers" }, 
      { id: "2",  title: "Add Seeker",                  icon: "person-add",            color: SECONDARY_COLOR, route: "/addSeeker",        permissionId: PERMISSIONS.ADD_SEEKER },
      { id: "3",  title: "Reports",                     icon: "bar-chart",             color: "#FF9800",       route: "/reports",          permissionId: PERMISSIONS.REPORTS },
      { id: "4",  title: "Roles",                       icon: "key-outline",           color: "#ac50f2",       route: "/roles",            permissionId: PERMISSIONS.ROLES },
      { id: "5",  title: "Users",                       icon: "person-circle-outline", color: "#22d6d6",       route: "/users",            permissionId: PERMISSIONS.USERS },
      { id: "6",  title: "Public Program Calling Team", icon: "people-circle-outline", color: "#C25D9A",       route: "/cct_users",        permissionId: PERMISSIONS.CCT },
      { id: "7",  title: "Zonal Statistics",            icon: "man-outline",           color: "#c27f5d",       route: "/users/zonal",      permissionId: PERMISSIONS.ZONAL },
      { id: "8",  title: "Mentors",                     icon: "ribbon-outline",        color: "#6d853e",       route: "/users/moderators", permissionId: PERMISSIONS.MENTOR },
      { id: "9",  title: "Zone",                        icon: "compass-outline",       color: "#3e857e",       route: "/zone",             permissionId: PERMISSIONS.ZONE },
      { id: "10", title: "Area",                        icon: "location-outline",      color: "#803e85",       route: "/area",             permissionId: PERMISSIONS.AREA },
      { id: "11", title: "Sessions",                    icon: "apps-outline",          color: "#853e47",       route: "/sessions",         permissionId: PERMISSIONS.SESSIONS },
      { id: "12", title: "Success",                     icon: "checkmark-done-outline",color: "#66a82f",       route: "/success",          permissionId: PERMISSIONS.SUCCESS },
      { id: "13", title: "Non-Interested",              icon: "person-remove-outline", color: "#a8492f",       route: "/noninterested",    permissionId: PERMISSIONS.NONINTERESTED },
      { id: "14", title: "Sessions Calling Team",       icon: "people-outline",        color: "#2f53a8",       route: "/ccrusers",         permissionId: PERMISSIONS.CCRUSER },
      { id: "15", title: "All Seekers",                 icon: "earth-outline",         color: "#2f53a8",       route: "/allseekers",       permissionId: PERMISSIONS.ALLSEEKERS },
    ];

    const accessibleMenuItems = menuItems.filter((item) => {
        if (!item.permissionId) return true;
        const userPerms = Array.isArray(user?.permissions) ? user.permissions : [];
        return userPerms.includes(Number(item.permissionId));
    });

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", onPress: async () => { await logout(); router.replace("/login"); } },
        ]);
    };

    if (loading || !user) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                <Text style={styles.loadingText}>Initializing...</Text>
            </View>
        );
    }

    const renderGridItem = ({ item }) => (
        <TouchableOpacity style={styles.gridCard} onPress={() => router.push(item.route)}>
            <View style={[styles.iconContainer, { backgroundColor: item.color + '1A' }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <Text style={styles.gridCardText}>{item.title}</Text>
        </TouchableOpacity>
    );
    
    const renderStatsCard = () => {
        if (isLoadingStats) return <View style={styles.statsContainer}><ActivityIndicator size="small" color={PRIMARY_COLOR} /></View>;
        if (error) return null;
        return (
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total</Text>
                    <Text style={styles.statCount}>{String(stats?.total_seekers ?? 0)}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Unassigned</Text>
                    <Text style={styles.statCount}>{String(stats?.unallocated_seekers ?? 0)}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: '#66a82f' }]}>Success</Text>
                    <Text style={[styles.statCount, { color: '#66a82f' }]}>{String(stats?.established_seekers ?? 0)}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* ── Header ──────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Text style={styles.welcomeText}>Hello, {user?.name || "User"}</Text>
                    <Text style={styles.roleText}>
                        {user?.role_name || "No Role"}{user?.zone_name ? ` • ${user.zone_name}` : ""}
                    </Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Ionicons name="log-out-outline" size={24} color="#F44336" />
                </TouchableOpacity>
            </View>

            {/* ── Stats (Admin / CCT Coordinator only) ────────────────────── */}
            {(userRoleId === 1 || userRoleId === 2) && renderStatsCard()}

            {/* ── Availability Banner (Calling Team members) ──────────────── */}
            {isPratishthanCalling && <AvailabilityBanner />}

            {/* ── Distribution Banner (Pratishthan Coordinator only) ──────── */}
            {isCoordinator && <DistributionBanner />}

            <Text style={styles.menuTitle}>Modules</Text>

            <FlatList
                data={accessibleMenuItems}
                renderItem={renderGridItem}
                keyExtractor={(item) => item.id}
                numColumns={NUM_COLUMNS}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.gridContainer}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: BACKGROUND_COLOR },
    centered:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText:  { marginTop: 10, color: SUBTLE_TEXT_COLOR },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
    userInfo: {},
    welcomeText: { fontSize: 18, fontWeight: '800', color: TEXT_COLOR },
    roleText:    { fontSize: 13, color: SUBTLE_TEXT_COLOR, marginTop: 2 },
    logoutButton: { padding: 5 },

    // ── Stats ────────────────────────────────────────────────────────────────
    statsContainer: {
        flexDirection: 'row', backgroundColor: '#fff',
        margin: 15, paddingVertical: 15, borderRadius: 15,
        borderWidth: 1, borderColor: '#f0f0f0',
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1,
    },
    statItem:    { flex: 1, alignItems: 'center' },
    statLabel:   { fontSize: 11, color: SUBTLE_TEXT_COLOR, fontWeight: '700', textTransform: 'uppercase' },
    statCount:   { fontSize: 18, fontWeight: '900', color: PRIMARY_COLOR, marginTop: 5 },
    statDivider: { width: 1, height: '70%', backgroundColor: '#eee', alignSelf: 'center' },

    // ── Availability Banner ──────────────────────────────────────────────────
    availabilityCard: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 15, marginTop: 12, marginBottom: 4,
        borderRadius: 14, padding: 14, borderWidth: 1,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08, shadowRadius: 3,
    },
    availabilityCardOn:  { backgroundColor: '#F1FFF3', borderColor: '#A5D6A7' },
    availabilityCardOff: { backgroundColor: '#FFF5F5', borderColor: '#FFCDD2' },
    availabilityLeft:    { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
    availabilityRight:   { marginLeft: 10 },
    availabilityIconWrap: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    availabilityTitle:   { fontSize: 13, fontWeight: '700', color: TEXT_COLOR, marginBottom: 2 },
    availabilityStatus:  { fontSize: 12, fontWeight: '600' },
    availabilityMeta:    { fontSize: 11, color: '#9E9E9E', marginTop: 2 },

    // ── Distribution Banner ──────────────────────────────────────────────────
    distributionCard: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 15, marginTop: 10, marginBottom: 4,
        borderRadius: 14, padding: 14,
        backgroundColor: '#F0F4FF', borderWidth: 1, borderColor: '#C5D3F5',
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08, shadowRadius: 3,
    },
    distributionLeft:     { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
    distributionIconWrap: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: '#3B5BDB',
        justifyContent: 'center', alignItems: 'center',
    },
    distributionTitle:    { fontSize: 13, fontWeight: '700', color: TEXT_COLOR, marginBottom: 2 },
    distributionSubtitle: { fontSize: 11, color: SUBTLE_TEXT_COLOR },
    distributionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#3B5BDB',
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 8, marginLeft: 10,
    },
    distributionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    // ── Menu Grid ────────────────────────────────────────────────────────────
    menuTitle:     { fontSize: 16, fontWeight: '700', marginLeft: 20, marginTop: 12, marginBottom: 10, color: TEXT_COLOR },
    gridContainer: { paddingHorizontal: 10, paddingBottom: 20 },
    row:           { justifyContent: 'flex-start' },
    gridCard: {
        flex: 1/NUM_COLUMNS, backgroundColor: '#fff', margin: 6,
        paddingVertical: 15, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#f0f0f0', elevation: 2,
    },
    iconContainer: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    gridCardText:  { fontSize: 10, fontWeight: '700', textAlign: 'center', color: TEXT_COLOR },
});