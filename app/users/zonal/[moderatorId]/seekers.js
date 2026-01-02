import React, { useEffect, useState } from "react";
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator,
    Platform,
    SafeAreaView
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import api from "../../../../src/api/apiClient.js"; 
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// --- Theme Constants ---
const PRIMARY_COLOR = "#007AFF"; 
const SUCCESS_COLOR = "#34C759"; 
const WARNING_COLOR = "#FF9500"; 
const TEXT_COLOR = "#1C1C1E";
const SUBTLE_TEXT_COLOR = "#8E8E93";
const ITEM_BACKGROUND = "#FFFFFF"; 
const BACKGROUND_COLOR = "#F2F2F7"; 

export default function ModeratorSeekersScreen() {
    const { moderatorId, name: moderatorName } = useLocalSearchParams(); 
    const [seekers, setSeekers] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!moderatorId) return;

        const fetchSeekers = async () => {
            try {
                console.log("Fetching seekers for mentor:", moderatorName);
                // Backend calls the specific moderator's seekers
                const response = await api.get(`/zones/${moderatorId}/moderatorseekers`);
                setSeekers(response.data);
            } catch (error) {
                console.log("Error fetching assigned seekers:", error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchSeekers();
    }, [moderatorId]);

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
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    title: `${moderatorName}'s Seekers`,
                }}
            />
            <View style={{ flex: 1 }}>
                <FlatList
                    data={seekers}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    // 🚀 Bottom Navigation Padding Fix
                    ListFooterComponent={<View style={{ height: 150 }} />}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.itemCard}
                            onPress={() => router.push(`/seeker/${item.id}`)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.itemContent}>
                                {/* Top Row: Name and Status Icons */}
                                <View style={styles.titleRow}>
                                    <Text style={styles.itemTitle}>{item.first_name} {item.last_name || ''}</Text>
                                    <View style={styles.iconStatusRow}>
                                         {/* Called Icon */}
                                         <Ionicons 
                                            name={item.caller_id ? "call-outline" : "alert-circle-outline"} 
                                            size={16} 
                                            color={item.caller_id ? SUCCESS_COLOR : WARNING_COLOR}                                              
                                        />
                                        {/* Assigned Icon (Green because they are in mentor's list) */}
                                        <Ionicons 
                                            name={item.moderator_id ? "person-outline" : "person-remove-outline"} 
                                            size={18} 
                                            color={SUCCESS_COLOR} 
                                            style={{ marginLeft: 8 }}
                                        />                                       
                                    </View>
                                </View>

                                {/* Middle Row: Contact Info */}
                                <View style={styles.detailRow}>
                                    <Ionicons name="phone-portrait-outline" size={14} color={SUBTLE_TEXT_COLOR} />
                                    <Text style={styles.subtitle}>{item.mobile || 'N/A'}</Text>
                                </View>

                                {/* Bottom Row: Start & Update Dates */}
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
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="alert-circle-outline" size={40} color={SUBTLE_TEXT_COLOR} />
                            <Text style={styles.emptyText}>No seekers assigned to {moderatorName}.</Text>
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 12 },
    
    // --- Card Styles ---
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
    itemTitle: { fontSize: 16, fontWeight: "700", color: TEXT_COLOR },
    iconStatusRow: { flexDirection: 'row', alignItems: 'center' },
    
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    subtitle: { fontSize: 13, color: SUBTLE_TEXT_COLOR, marginLeft: 5 },
    
    dateRow: { flexDirection: 'row', alignItems: 'center' },
    dateBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: "#F2F2F7", 
        paddingHorizontal: 8, 
        paddingVertical: 3, 
        borderRadius: 4 
    },
    dateText: { fontSize: 11, color: "#555", marginLeft: 4, fontWeight: '500' },

    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: SUBTLE_TEXT_COLOR,
        textAlign: 'center',
    }
});