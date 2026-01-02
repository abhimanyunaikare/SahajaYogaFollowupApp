import React, { useEffect, useState } from "react";
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator, 
    Platform,
    Linking,
    SafeAreaView
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router"; 
import api from "../../../../src/api/apiClient"; 
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// --- Theme Constants ---
const PRIMARY_COLOR = "#007AFF"; 
const TEXT_COLOR = "#1C1C1E";
const SUBTLE_TEXT_COLOR = "#8E8E93";
const SUCCESS_COLOR = "#34C759";
const BACKGROUND_COLOR = "#F2F2F7"; 
const ITEM_BACKGROUND = "#FFFFFF"; 

export default function ZoneModeratorsScreen() {
    const { zoneId, name: zoneName } = useLocalSearchParams(); 
    const [moderators, setModerators] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!zoneId) return;
        const fetchModerators = async () => {
            try {
                const response = await api.get(`/zones/${zoneId}/moderators`);
                setModerators(response.data);
            } catch (error) {
                console.log("Error fetching zone mentors:", error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchModerators();
    }, [zoneId]);

    const handleCall = (phoneNumber) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber}`).catch(err => console.error('Failed to open dialer', err));
        }
    };

    const handleModeratorPress = (moderatorId, moderatorName) => {        
        router.push(`/users/zonal/${moderatorId}/seekers?name=${moderatorName}`);
    };

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
            <Stack.Screen options={{ title: `${zoneName} Mentors` }} />
            
            <View style={{ flex: 1 }}>
                <FlatList
                    data={moderators}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    // 🚀 Bottom Navigation fix
                    ListFooterComponent={<View style={{ height: 150 }} />}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.itemCard}
                            onPress={() => handleModeratorPress(item.id, item.name)} 
                            activeOpacity={0.7}
                        >
                            {/* Left: Avatar/Icon */}
                            <View style={styles.avatarContainer}>
                                <Ionicons name="person-circle" size={48} color={PRIMARY_COLOR} />
                            </View>

                            <View style={styles.itemContent}>
                                {/* Top Row: Name and Count */}
                                <View style={styles.titleRow}>
                                    <Text style={styles.itemTitle}>{item.name}</Text>
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{item.seekers_count || 0} Seekers</Text>
                                    </View>
                                </View>
                                
                                {/* Info Row: Status & Mobile */}
                                <View style={styles.detailRow}>
                                    <Ionicons name="call-outline" size={14} color={SUBTLE_TEXT_COLOR} />
                                    <Text style={styles.subtitle}>{item.mobile || 'No Mobile'}</Text>
                                    <View style={styles.dotSeparator} />
                                    {/* <Ionicons name="shield-checkmark-outline" size={14} color={SUCCESS_COLOR} />
                                    <Text style={[styles.subtitle, {color: SUCCESS_COLOR}]}>Active</Text> */}
                                </View>

                                {/* Bottom Row: Dates
                                <View style={styles.dateRow}>
                                    <View style={styles.dateBadge}>
                                        <MaterialCommunityIcons name="clock-outline" size={12} color="#555" />
                                        <Text style={styles.dateText}>Joined: {formatDate(item.created_at)}</Text>
                                    </View>
                                    <View style={[styles.dateBadge, { marginLeft: 8 }]}>
                                        <MaterialCommunityIcons name="update" size={12} color="#555" />
                                        <Text style={styles.dateText}>Upd: {formatDate(item.updated_at)}</Text>
                                    </View>
                                </View> */}
                            </View>
                            
                            {/* Call Action */}
                            <TouchableOpacity
                                style={[styles.callButton, !item.mobile && styles.disabledButton]}
                                onPress={() => handleCall(item.mobile)}
                                disabled={!item.mobile}
                            >
                                <Ionicons name="call" size={20} color="white" />
                            </TouchableOpacity>

                            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" style={{marginLeft: 5}} />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={50} color={SUBTLE_TEXT_COLOR} />
                            <Text style={styles.emptyText}>No mentors found in {zoneName}.</Text>
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
    
    itemCard: {
        backgroundColor: ITEM_BACKGROUND,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
    },
    avatarContainer: { marginRight: 12 },
    itemContent: { flex: 1 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    itemTitle: { fontSize: 16, fontWeight: "700", color: TEXT_COLOR },
    
    badge: { backgroundColor: '#E8F2FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    badgeText: { fontSize: 11, color: PRIMARY_COLOR, fontWeight: '700' },

    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    subtitle: { fontSize: 13, color: SUBTLE_TEXT_COLOR, marginLeft: 4 },
    dotSeparator: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#C7C7CC", marginHorizontal: 8 },

    dateRow: { flexDirection: 'row', alignItems: 'center' },
    dateBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#F2F2F7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    dateText: { fontSize: 10, color: "#555", marginLeft: 4 },

    callButton: {
        backgroundColor: SUCCESS_COLOR,
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    disabledButton: { backgroundColor: '#D1D1D6' },

    emptyContainer: { padding: 40, alignItems: 'center', marginTop: 50 },
    emptyText: { marginTop: 10, fontSize: 16, color: SUBTLE_TEXT_COLOR, textAlign: 'center' }
});