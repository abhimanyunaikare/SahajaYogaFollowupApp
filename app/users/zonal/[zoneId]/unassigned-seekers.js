import React, { useEffect, useState } from "react";
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator,
    SafeAreaView,
    Platform
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import api from "../../../../src/api/apiClient.js"; 
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// --- Theme Constants ---
const PRIMARY_COLOR = "#007AFF"; 
const SUCCESS_COLOR = "#34C759"; // Green
const WARNING_COLOR = "#FF9500"; // Orange
const DANGER_COLOR = "#FF3B30"; // Red
const BACKGROUND_COLOR = "#F2F2F7";
const ITEM_BACKGROUND = "#FFFFFF"; 

export default function UnassignedSeekersScreen() {
    const { zoneId, name: zoneName } = useLocalSearchParams(); 
    const [seekers, setSeekers] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchSeekers = async () => {
            try {
                console.log('unassign');

                const response = await api.get(`/zones/${zoneId}/seekers?status=unassigned`);
                setSeekers(response.data);
            } catch (error) {
                console.log("Error:", error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchSeekers();
    }, [zoneId]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
        });
    };

    if (loading) {
        return <ActivityIndicator style={styles.loader} size="large" color={PRIMARY_COLOR} />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
            <Stack.Screen options={{ title: "Unassigned List" }} />
            
            <FlatList
                data={seekers}
                keyExtractor={(item) => item.id.toString()}
                // 🚀 Bottom padding fix for navigation bar
                contentContainerStyle={{
                    paddingHorizontal: 12,
                    paddingTop: 12,
                    // Yahan padding badha kar 160 karein taaki safe rahe
                    paddingBottom: Platform.OS === 'ios' ? 170 : 150, 
                    flexGrow: 1 // Ye zaroori hai
                }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.itemCard}
                        onPress={() => router.push(`/seeker/${item.id}`)}
                    >
                        <View style={styles.itemContent}>
                            {/* Top Row: Name and Icons */}
                            <View style={styles.titleRow}>
                                <Text style={styles.itemTitle}>{item.first_name} {item.last_name}</Text>
                                <View style={styles.iconStatusRow}>
                                    {/* Called Icon */}
                                    <Ionicons 
                                        name="call" 
                                        size={16} 
                                        color={item.caller_id ? SUCCESS_COLOR : WARNING_COLOR} 
                                    />
                                    {/* Assigned Icon (Red since it's unassigned list) */}
                                    <Ionicons 
                                        name={item.moderator_id ? "person-outline" : "person-remove-outline"} 
                                        size={18} 
                                        color={item.moderator_id ? SUCCESS_COLOR : DANGER_COLOR} 
                                        style={{ marginLeft: 8 }} 
                                    />                                    
                                </View>
                            </View>

                            {/* Middle Row: Mobile & Zone */}
                            <View style={styles.detailRow}>
                                <Ionicons name="phone-portrait-outline" size={14} color="#8E8E93" />
                                <Text style={styles.subtitle}>{item.mobile || 'N/A'}</Text>
                                <View style={styles.dotSeparator} />
                                <Text style={styles.subtitle}>{zoneName}</Text>
                            </View>

                            {/* Bottom Row: Start & Updated Dates */}
                            <View style={styles.dateRow}>
                                <View style={styles.dateBadge}>
                                    <MaterialCommunityIcons name="calendar-plus" size={12} color="#555" />
                                    <Text style={styles.dateText}>Start: {formatDate(item.created_at)}</Text>
                                </View>
                                <View style={[styles.dateBadge, { marginLeft: 10 }]}>
                                    <MaterialCommunityIcons name="calendar-sync" size={12} color="#555" />
                                    <Text style={styles.dateText}>Upd: {formatDate(item.updated_at)}</Text>
                                </View>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
    loader: { flex: 1, justifyContent: 'center' },
    listContent: { 
        padding: 12, 
        // paddingBottom: Platform.OS === 'ios' ? 120 : 100 
        paddingBottom: 100
    },
    itemCard: {
        backgroundColor: ITEM_BACKGROUND,
        borderRadius: 12,
        marginBottom: 10,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
    },
    itemContent: { flex: 1 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    itemTitle: { fontSize: 16, fontWeight: "700", color: "#1C1C1E" },
    iconStatusRow: { flexDirection: 'row', alignItems: 'center' },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    subtitle: { fontSize: 13, color: "#8E8E93", marginLeft: 4 },
    dotSeparator: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#C7C7CC", marginHorizontal: 8 },
    dateRow: { flexDirection: 'row', alignItems: 'center' },
    dateBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: "#F2F2F7", 
        paddingHorizontal: 8, 
        paddingVertical: 3, 
        borderRadius: 4 
    },
    dateText: { fontSize: 11, color: "#555", marginLeft: 4, fontWeight: '500' }
});