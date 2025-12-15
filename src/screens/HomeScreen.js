import React, { useEffect, useState, useContext } from "react";
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
  ADD_SEEKER: 2,
  USERS: 3,
  ROLES: 5,
  REPORTS: 7,
};

export default function HomeScreen() {
    const [stats, setStats] = useState(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true); 
    const [error, setError] = useState(null); 
    const router = useRouter();
    const { user, logout } = useContext(AuthContext);
    const APP_NAME = "SahajaYoga Seeker Followup"; // 👈 Define your app name

    useEffect(() => {
      const fetchSeekers = async () => {
        setIsLoadingStats(true);
        setError(null);
        try {
            console.log(user);
          const response = await api.get("/dashboard/stats");
          setStats(response.data);
        } catch (error) {
          console.log("Error fetching stats:", error.message);
          setError("Failed to load dashboard statistics.");
        } finally {
          setIsLoadingStats(false);
        }
      };
      fetchSeekers();
    }, []);

    const menuItems = [
      // ✅ FIX: Set the route directly to the intended destination /seekersList
      { id: "1", title: "Seekers List", icon: "people", color: PRIMARY_COLOR, route: "/seekers" }, 
      { id: "2", title: "Add Seeker", icon: "person-add", color: SECONDARY_COLOR, route: "/addSeeker", permissionId: PERMISSIONS.ADD_SEEKER },
      { id: "3", title: "Reports", icon: "bar-chart", color: "#FF9800", route: "/reports", permissionId: PERMISSIONS.REPORTS },
      { id: "4", title: "Roles", icon: "key-outline", color: "#ac50f2", route: "/roles", permissionId: PERMISSIONS.ROLES },
      { id: "5", title: "Users", icon: "person-circle-outline", color: "#22d6d6", route: "/users", permissionId: PERMISSIONS.USERS },
      { id: "9", title: "CCT Users", icon: "people-circle-outline", color: "#C25D9A", route: "/cct_users", permissionId: PERMISSIONS.USERS },
      { id: "10", title: "Zonal Statistics", icon: "man-outline", color: "#c27f5d", route: "/users/zonal", permissionId: PERMISSIONS.USERS },
      { id: "11", title: "Moderators", icon: "ribbon-outline", color: "#6d853e", route: "/users/moderators", permissionId: PERMISSIONS.USERS },
    ];

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                onPress: async () => {
                    await logout();
                    router.replace("/login");
                },
            },
        ]);
    };

    const handlePress = async (item) => {
        // ✅ FIX: Navigate directly using the route defined in the menu item
        router.push(item.route);
    };

    const accessibleMenuItems = menuItems.filter(
      (item) =>
        !item.permissionId ||
        user?.permissions?.includes(item.permissionId)
    );

    const renderGridItem = ({ item }) => {
        return (
            <TouchableOpacity
                style={styles.gridCard}
                onPress={() => handlePress(item)}
            >
                <View style={[styles.iconContainer, { backgroundColor: item.color + '1A' }]}>
                    <Ionicons 
                        name={item.icon} 
                        size={20} 
                        color={item.color} 
                    />
                </View>
                
                <Text style={styles.gridCardText}>
                    {item.title}
                </Text>
            </TouchableOpacity>
        );
    };
    
    // --- Condensed Stats Card ---
    const renderStatsCard = () => {
        if (isLoadingStats) {
            return (
                <View style={[styles.statsContainer, {paddingVertical: 10}]}>
                    <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                    <Text style={styles.statsLoadingText}>Loading statistics...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={[styles.statsContainer, styles.statsError]}>
                    <Text style={styles.statsErrorText}>❌ {error}</Text>
                </View>
            );
        }

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
      <SafeAreaView style={styles.container}>
          
          {/* OPTIMIZED HEADER */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
                <Text style={styles.welcomeText}>Hello, {user?.name || "User"}</Text>
                <Text style={styles.roleText}>{user?.role_name || "No Role"}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Ionicons name="log-out-outline" size={24} color="#F44336" />
            </TouchableOpacity>
          </View>
          
          {/* STATISTICS CARD (Condensed) */}
          {renderStatsCard()}

          {/* NAVIGATION GRID TITLE */}
          <Text style={styles.menuTitle}>Modules</Text>

          {/* NAVIGATION GRID (3-Column Dense Grid) */}
          <FlatList
            data={accessibleMenuItems}
            renderItem={renderGridItem}
            keyExtractor={(item) => item.id}
            key={NUM_COLUMNS} 
            numColumns={NUM_COLUMNS} 
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.gridContainer}
          />
        </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: BACKGROUND_COLOR, 
        paddingHorizontal: 15,
        paddingTop: 5, 
    },
    
    // --- Optimized Header Styles ---
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    userInfo: {
    },
    welcomeText: { 
        fontSize: 18, 
        fontWeight: "700", 
        color: TEXT_COLOR 
    },
    roleText: { 
        fontSize: 14, 
        color: SUBTLE_TEXT_COLOR, 
        marginTop: 2 
    },
    logoutButton: {
        padding: 5,
    },
    
    // --- Stats Card (Minimalist) ---
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: '#F8F8F8', 
        borderRadius: 12,
        paddingVertical: 15,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    statsLoadingText: {
        marginLeft: 8,
        color: SUBTLE_TEXT_COLOR
    },
    statsError: {
        paddingVertical: 15,
        backgroundColor: '#FFEEEE',
        borderColor: '#F4433650',
    },
    statsErrorText: {
        color: '#F44336',
        textAlign: 'center',
        flex: 1,
        fontWeight: '500'
    },
    statItem: {
        alignItems: "center",
        flex: 1,
        paddingHorizontal: 5,
    },
    statCount: { 
        fontSize: 20, 
        fontWeight: "900", 
        color: PRIMARY_COLOR, 
        marginTop: 4,
    },
    statLabel: { 
        fontSize: 12, 
        color: SUBTLE_TEXT_COLOR, 
        textAlign: 'center',
        fontWeight: '500'
    },
    statDivider: {
        width: 1,
        backgroundColor: BORDER_COLOR,
        marginHorizontal: 10,
    },
    
    // --- Navigation Grid ---
    menuTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: TEXT_COLOR,
        marginBottom: 10,
        paddingLeft: 5,
    },
    gridContainer: {
        paddingBottom: 20,
    },
    row: { 
        justifyContent: "space-between", 
        marginBottom: 10 
    },
    gridCard: {
        flex: 1,
        height: 90, 
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 5,
        backgroundColor: '#F8F8F8', 
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    iconContainer: {
        padding: 10,
        borderRadius: 8,
    },
    gridCardText: { 
        color: TEXT_COLOR, 
        marginTop: 8, 
        fontSize: 12, 
        fontWeight: "600",
        textAlign: 'center',
        paddingHorizontal: 2,
    },
  });