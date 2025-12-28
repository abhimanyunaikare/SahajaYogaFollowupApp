import React, { useEffect, useState, useContext, useCallback } from "react";
import { 
    View, 
    Text, 
    Alert, 
    TouchableOpacity, 
    StyleSheet, 
    FlatList, 
    ActivityIndicator, 
    Platform 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import { AuthContext } from "../../src/context/AuthContext";
import api from "../api/apiClient";
import { SafeAreaView } from "react-native-safe-area-context";

// --- Constants ---
const PRIMARY_COLOR = "#007AFF"; 
const SECONDARY_COLOR = "#2196F3"; 
const BACKGROUND_COLOR = "#FFFFFF"; 
const BORDER_COLOR = "#E0E0E0"; 
const TEXT_COLOR = "#212121";
const SUBTLE_TEXT_COLOR = "#757575";
const NUM_COLUMNS = 3; 

const PERMISSIONS = {
  ADD_SEEKER: 1,
  USERS: 3,
  ROLES: 5,
  REPORTS: 7,
  CCT: 9,
  ZONAL: 10,
  MENTOR: 11,
  ZONE: 12,
  AREA: 13,
  SESSIONS: 14,
};

const HEADER_TITLE_STYLE = {
    fontSize: 20, 
    fontWeight: '700',
    color: TEXT_COLOR,
};

export default function HomeScreen() {
    const [stats, setStats] = useState(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false); 
    const [error, setError] = useState(null); 
    const router = useRouter();
    
    // Get loading state from AuthContext to prevent crashes on startup
    const { user, loading, logout , validateUserSession} = useContext(AuthContext);
    const APP_NAME = "SahajaYoga Seeker Followup";

    // 1. Fetch Stats logic wrapped in useCallback for safety
    const fetchStats = useCallback(async () => {
        // Only fetch if user has Role 1 or 2
        const role = user?.role_id ? Number(user.role_id) : null;
        if (role !== 1 && role !== 2) return;

        setIsLoadingStats(true);
        setError(null);
        try {
            const response = await api.get("/dashboard/stats");
            console.log(user)
            setStats(response.data);
        } catch (err) {
            console.log("Error fetching stats:", err.message);
            setError("Failed to load dashboard statistics.");
        } finally {
            setIsLoadingStats(false);
        }
    }, [user?.role_id]);

    useEffect(() => {
        const checkSecurity = async () => {
            if (user && !loading) {
                // Now this function will correctly exist
                const isValid = await validateUserSession(user); 
                
                if (isValid) {
                    fetchStats();
                } else {
                    // router.replace("/login") is usually handled by AuthProvider 
                    // state changes, but we can be explicit here:
                    router.replace("/login"); 
                }
            }
        };

        checkSecurity();
    }, [user?.role_id]); // Re-run if role_id changes

    // 2. Define Menu Items
    const menuItems = [
      { id: "1", title: "Seekers List", icon: "people", color: PRIMARY_COLOR, route: "/seekers" }, 
      { id: "2", title: "Add Seeker", icon: "person-add", color: SECONDARY_COLOR, route: "/addSeeker", permissionId: PERMISSIONS.ADD_SEEKER },
      { id: "3", title: "Reports", icon: "bar-chart", color: "#FF9800", route: "/reports", permissionId: PERMISSIONS.REPORTS },
      { id: "4", title: "Roles", icon: "key-outline", color: "#ac50f2", route: "/roles", permissionId: PERMISSIONS.ROLES },
      { id: "5", title: "Users", icon: "person-circle-outline", color: "#22d6d6", route: "/users", permissionId: PERMISSIONS.USERS },
      { id: "6", title: "CCT Users", icon: "people-circle-outline", color: "#C25D9A", route: "/cct_users", permissionId: PERMISSIONS.CCT },
      { id: "7", title: "Zonal Statistics", icon: "man-outline", color: "#c27f5d", route: "/users/zonal", permissionId: PERMISSIONS.ZONAL },
      { id: "8", title: "Mentors", icon: "ribbon-outline", color: "#6d853e", route: "/users/moderators", permissionId: PERMISSIONS.MENTOR },
      { id: "9", title: "Zone", icon: "compass-outline", color: "#3e857e", route: "/zone", permissionId: PERMISSIONS.ZONE },
      { id: "10", title: "Area", icon: "location-outline", color: "#803e85", route: "/area", permissionId: PERMISSIONS.AREA },
      { id: "11", title: "Pratishthan Sessions", icon: "grid-outline", color: "#853e47", route: "/sessions", permissionId: PERMISSIONS.SESSIONS },
    ];

    // 3. Filtered Menu Items (with null safety)
    const accessibleMenuItems = menuItems.filter((item) => {
        if (!item.permissionId) return true;
        return Array.isArray(user?.permissions) && user.permissions.includes(item.permissionId);
    });

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", onPress: async () => { await logout(); router.replace("/login"); } },
        ]);
    };

    // --- GUARD CLAUSE: Show Loading Screen while Auth initializes ---
    if (loading || !user) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                <Text style={styles.loadingText}>Initializing Session...</Text>
            </View>
        );
    }

    const renderGridItem = ({ item }) => (
        <TouchableOpacity style={styles.gridCard} onPress={() => router.push(item.route)}>
            <View style={[styles.iconContainer, { backgroundColor: item.color + '1A' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <Text style={styles.gridCardText}>{item.title}</Text>
        </TouchableOpacity>
    );
    
    const renderStatsCard = () => {
        if (isLoadingStats) {
            return (
                <View style={styles.statsContainer}>
                    <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                </View>
            );
        }
        if (error) return null; // Hide card if error

        return (
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Unassigned</Text>
                    <Text style={styles.statCount}>{stats?.unallocated_seekers ?? 0}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Seekers</Text>
                    <Text style={styles.statCount}>{stats?.total_seekers ?? 0}</Text>
                </View>
            </View>
        );
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.container}>
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <Text style={styles.welcomeText}>Hello, {user?.name || "User"}</Text>
                        <Text style={styles.roleText}>
                            {user?.role_name || "No Role"}{user?.zone_name ? `, ${user.zone_name}` : ""}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Ionicons name="log-out-outline" size={24} color="#F44336" />
                    </TouchableOpacity>
                </View>
                
                {/* STATS: Only for Admin/Zonal (Role 1 or 2) */}
                {(Number(user?.role_id) === 1 || Number(user?.role_id) === 2) && renderStatsCard()}

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
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND_COLOR },
    loadingText: { marginTop: 10, color: SUBTLE_TEXT_COLOR },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    welcomeText: { fontSize: 18, fontWeight: '700', color: TEXT_COLOR },
    roleText: { fontSize: 14, color: SUBTLE_TEXT_COLOR, marginTop: 2 },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        margin: 15,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        alignItems: 'center',
    },
    statItem: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 12, color: SUBTLE_TEXT_COLOR, marginBottom: 4 },
    statCount: { fontSize: 18, fontWeight: 'bold', color: PRIMARY_COLOR },
    statDivider: { width: 1, height: '80%', backgroundColor: BORDER_COLOR },
    menuTitle: { fontSize: 16, fontWeight: '700', marginLeft: 20, marginBottom: 10, color: TEXT_COLOR },
    gridContainer: { paddingHorizontal: 10 },
    row: { justifyContent: 'flex-start' },
    gridCard: {
        flex: 1/NUM_COLUMNS,
        backgroundColor: '#fff',
        margin: 8,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
            android: { elevation: 2 }
        })
    },
    iconContainer: { width: 45, height: 45, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    gridCardText: { fontSize: 11, fontWeight: '600', textAlign: 'center', color: TEXT_COLOR },
    logoutButton: { padding: 5 }
});