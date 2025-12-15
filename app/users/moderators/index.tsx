// users/zonal/[zoneId]/moderators.js

import React, { useEffect, useState, useContext } from "react";
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator, 
    Platform,
    Linking // Added Linking for phone call
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router"; 
import api from "../../../src/api/apiClient.js"; 
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../../src/context/AuthContext";

// --- Constants ---
const PRIMARY_COLOR = "#007AFF"; 
const TEXT_COLOR = "#212121";
const SUBTLE_TEXT_COLOR = "#757575";
const ACCENT_COLOR = "#4CAF50";
const BACKGROUND_COLOR = "#F4F4F4"; 
const ITEM_BACKGROUND = "#FFFFFF"; 

export default function ZoneModeratorsScreen() {
    // Note: The file path is app/users/zonal/[zoneId]/moderators.js
    const { user} = useContext(AuthContext);
    const { zoneId, name: zoneName } = useLocalSearchParams(); 
    const [moderators, setModerators] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const targetZoneId = zoneId || user?.zone_id;

    useEffect(() => {
// Only run fetch if we have a valid zone ID
        if (!targetZoneId) {
            setLoading(false);
            console.log("No zone ID available for fetching moderators.");
            return;
        }
                // ... (fetchModerators logic remains the same)
        const fetchModerators = async () => {
            try {
                console.log(`${targetZoneId}`);
                // const response = await api.get(`/zones/3/moderators`);
                const response = await api.get(`/zones/${targetZoneId}/moderators`);
                setModerators(response.data);
            } catch (error) {
                console.log("Error fetching zone mentors:", error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchModerators();
    }, [zoneId]);

    // Function to handle phone call
    const handleCall = (phoneNumber) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber}`).catch(err => console.error('Failed to open dialer', err));
        }
    };

    // Corrected Navigation: Whole card press opens seekers list
    const handleModeratorPress = (moderatorId, moderatorName) => {
        // Correct pathing based on your stated target: app/users/zonal/[moderatorId]/seekers.js
        // We navigate back to the 'zonal' root and then into the dynamic [moderatorId]
        // This assumes your Expo Router is configured to handle the structure correctly.
        router.push(`/users/zonal/${moderatorId}/seekers?name=${moderatorName}`);
    };

    if (loading) {
        return <ActivityIndicator style={styles.loader} size="large" color={PRIMARY_COLOR} />;
    }

    const EmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={40} color={SUBTLE_TEXT_COLOR} />
            <Text style={styles.emptyText}>No mentors found in {zoneName}.</Text>
        </View>
    );

    return (
        <>
            <Stack.Screen
                options={{
                    title: `${zoneName} Mentors`,
                }}
            />
            <View style={styles.container}>
                <FlatList
                    data={moderators}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        // WRAP THE ENTIRE CARD IN TOUCHABLEOPACITY FOR SEEKER NAVIGATION
                        <TouchableOpacity
                            style={styles.itemCard}
                            onPress={() => handleModeratorPress(item.id, item.name)} 
                        >
                            <Ionicons name="person-circle-outline" size={36} color={PRIMARY_COLOR} style={styles.memberIcon} />

                            <View style={styles.itemContent}>
                                {/* Moderator Name */}
                                <Text style={styles.itemTitle}>{item.name}</Text>
                                
                                {/* Assigned Seekers Count */}
                                <View style={styles.detailRow}>
                                    <Ionicons name="checkmark-circle-outline" size={14} color={ACCENT_COLOR} />
                                    <Text style={[styles.countText, { color: ACCENT_COLOR }]}>
                                        {item.seekers_count || 0} Seekers Assigned
                                    </Text>
                                </View>
                            </View>
                            
                            {/* DEDICATED CALL BUTTON (Stops navigation logic from triggering) */}
                            <TouchableOpacity
                                style={styles.callButton}
                                onPress={() => handleCall(item.mobile)}
                                disabled={!item.mobile}
                            >
                                <Ionicons 
                                    name="call" 
                                    size={24} 
                                    color={item.mobile ? ITEM_BACKGROUND : SUBTLE_TEXT_COLOR} 
                                />
                            </TouchableOpacity>
                             {/* Navigation Chevron */}
                            <Ionicons name="chevron-forward" size={20} color={SUBTLE_TEXT_COLOR} />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={EmptyList}
                    contentContainerStyle={styles.listContent}
                />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND_COLOR },
    listContent: { paddingHorizontal: 15, paddingVertical: 15 },
    itemCard: {
        backgroundColor: ITEM_BACKGROUND,
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        elevation: 1.5,
    },
    memberIcon: {
        marginRight: 15,
        opacity: 0.8,
    },
    itemContent: { flex: 1 },
    itemTitle: { fontSize: 16, fontWeight: "700", color: TEXT_COLOR, marginBottom: 5 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    countText: { fontSize: 14, fontWeight: '600', marginLeft: 5 },
    callButton: { // Dedicated button style
        backgroundColor: PRIMARY_COLOR,
        padding: 8,
        borderRadius: 20,
        marginLeft: 10,
    },
    emptyContainer: {
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ITEM_BACKGROUND,
        borderRadius: 8,
        marginTop: 20,
      },
      emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: SUBTLE_TEXT_COLOR,
        textAlign: 'center',
      }
});