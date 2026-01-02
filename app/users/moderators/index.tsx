import React, { useEffect, useState, useContext } from "react";
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
import api from "../../../src/api/apiClient.js"; 
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { AuthContext } from "../../../src/context/AuthContext";

// --- Theme Constants ---
const PRIMARY_COLOR = "#007AFF"; 
const SUCCESS_COLOR = "#34C759"; 
const TEXT_COLOR = "#1C1C1E";
const SUBTLE_TEXT_COLOR = "#8E8E93";
const BACKGROUND_COLOR = "#F2F2F7"; 
const ITEM_BACKGROUND = "#FFFFFF"; 

export default function ZoneModeratorsScreen() {
    const { user } = useContext(AuthContext);
    const { zoneId } = useLocalSearchParams(); 
    const [moderators, setModerators] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const targetZoneId = zoneId || user?.zone_id;
    const roleId = user?.role_id;
    const effective_zone_name = user?.zone_name || 'Selected Zone';

    useEffect(() => {
        if (!targetZoneId) {
            setLoading(false);
            return;
        }
        const fetchModerators = async () => {
            try {
                const response = await api.get(`/zones/${targetZoneId}/moderators?role_id=${roleId}`);
                setModerators(response.data);
            } catch (error) {
                console.log("Error fetching zone mentors:", error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchModerators();
    }, [targetZoneId]);

    const handleCall = (phoneNumber) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber}`).catch(err => console.error('Dialer error', err));
        }
    };

    const handleModeratorPress = (moderatorId, moderatorName) => {
        router.push(`/users/zonal/${moderatorId}/seekers?name=${moderatorName}`);
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: `${effective_zone_name} Mentors` }} />
            
            <FlatList
                data={moderators}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                // 🚀 Bottom Padding Fix
                ListFooterComponent={<View style={{ height: 150 }} />}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.itemCard}
                        onPress={() => handleModeratorPress(item.id, item.name)}
                        activeOpacity={0.7}
                    >
                        {/* Avatar Initials */}
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{item.name?.substring(0, 2).toUpperCase()}</Text>
                        </View>

                        <View style={styles.itemContent}>
                            {/* Name and Badge */}
                            <View style={styles.titleRow}>
                                <Text style={styles.itemTitle}>{item.name}</Text>
                                <View style={styles.countBadge}>
                                    <Text style={styles.countText}>{item.seekers_count || 0} Seekers</Text>
                                </View>
                            </View>
                            
                            {/* Mobile Info */}
                            <View style={styles.detailRow}>
                                <Ionicons name="call-outline" size={14} color={SUBTLE_TEXT_COLOR} />
                                <Text style={styles.subtitle}>{item.mobile || 'No Mobile'}</Text>
                            </View>

                            {/* Status Info */}
                            {/* <View style={styles.statusRow}>
                                <MaterialCommunityIcons name="account-check-outline" size={14} color={SUCCESS_COLOR} />
                                <Text style={styles.statusText}>Active Mentor</Text>
                            </View> */}
                        </View>
                        
                        {/* 📞 Call Action Button */}
                        <TouchableOpacity
                            style={[styles.callButton, !item.mobile && styles.disabledCall]}
                            onPress={() => handleCall(item.mobile)}
                            disabled={!item.mobile}
                        >
                            <Ionicons name="call" size={18} color="white" />
                        </TouchableOpacity>

                        <Ionicons name="chevron-forward" size={18} color="#C7C7CC" style={{ marginLeft: 5 }} />
                    </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={50} color={SUBTLE_TEXT_COLOR} />
                        <Text style={styles.emptyText}>No mentors found in {effective_zone_name}.</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 12 },
    
    // --- Modern Card Styles ---
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
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#E8F2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: { color: PRIMARY_COLOR, fontWeight: '700', fontSize: 15 },
    itemContent: { flex: 1 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    itemTitle: { fontSize: 16, fontWeight: "700", color: TEXT_COLOR },
    
    countBadge: {
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    countText: { fontSize: 11, color: PRIMARY_COLOR, fontWeight: '700' },

    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    subtitle: { fontSize: 13, color: SUBTLE_TEXT_COLOR, marginLeft: 4 },
    
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    statusText: { fontSize: 12, color: SUCCESS_COLOR, marginLeft: 4, fontWeight: '500' },

    callButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: SUCCESS_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    disabledCall: { backgroundColor: '#D1D1D6' },

    emptyContainer: { padding: 40, alignItems: 'center', marginTop: 50 },
    emptyText: { marginTop: 10, fontSize: 16, color: SUBTLE_TEXT_COLOR, textAlign: 'center' }
});