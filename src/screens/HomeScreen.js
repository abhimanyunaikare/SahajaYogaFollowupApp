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

// ✨ Server IDs ke mutabiq sync kiya gaya
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
  SESSIONS: 15,
  SUCCESS: 16,
};

export default function HomeScreen() {
    const [stats, setStats] = useState(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false); 
    const [error, setError] = useState(null); 
    const router = useRouter();
    
    const { user, loading, logout, validateUserSession } = useContext(AuthContext);

    const fetchStats = useCallback(async () => {
        console.log(user);

        const role = user?.role_id ? Number(user.role_id) : null;
        if (role !== 1 && role !== 2) return;

        setIsLoadingStats(true);
        setError(null);
        try {
            console.log('Fetching stats');
            const response = await api.get("/dashboard/stats");
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
      { id: "11", title: "Sessions", icon: "apps-outline", color: "#853e47", route: "/sessions", permissionId: PERMISSIONS.SESSIONS },
      { id: "12", title: "Success", icon: "checkmark-done-outline", color: "#66a82f", route: "/success", permissionId: PERMISSIONS.SUCCESS },
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
        if (isLoadingStats) {
            return (
                <View style={styles.statsContainer}>
                    <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                </View>
            );
        }
        if (error) return null;

        return (
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total</Text>
                    {/* Safe rendering using string conversion */}
                    <Text style={styles.statCount}>{String(stats?.total_seekers ?? 0)}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Unassigned</Text>
                    <Text style={styles.statCount}>{String(stats?.unallocated_seekers ?? 0)}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statLabel, {color: '#66a82f'}]}>Success</Text>
                    <Text style={[styles.statCount, {color: '#66a82f'}]}>{String(stats?.established_seekers ?? 0)}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            
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
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: SUBTLE_TEXT_COLOR },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
    welcomeText: { fontSize: 18, fontWeight: '800', color: TEXT_COLOR },
    roleText: { fontSize: 13, color: SUBTLE_TEXT_COLOR, marginTop: 2 },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: 15,
        paddingVertical: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 11, color: SUBTLE_TEXT_COLOR, fontWeight: '700', textTransform: 'uppercase' },
    statCount: { fontSize: 18, fontWeight: '900', color: PRIMARY_COLOR, marginTop: 5 },
    statDivider: { width: 1, height: '70%', backgroundColor: '#eee', alignSelf: 'center' },
    menuTitle: { fontSize: 16, fontWeight: '700', marginLeft: 20, marginBottom: 10, color: TEXT_COLOR },
    gridContainer: { paddingHorizontal: 10, paddingBottom: 20 },
    row: { justifyContent: 'flex-start' },
    gridCard: {
        flex: 1/NUM_COLUMNS,
        backgroundColor: '#fff',
        margin: 6,
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 2,
    },
    iconContainer: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    gridCardText: { fontSize: 10, fontWeight: '700', textAlign: 'center', color: TEXT_COLOR },
    logoutButton: { padding: 5 }
});