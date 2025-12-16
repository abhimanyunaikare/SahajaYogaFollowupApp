// app/users/moderators/[moderatorId]/seekers.js

import React, { useEffect, useState } from "react";
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator 
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import api from "../../../../src/api/apiClient.js"; 
import { Ionicons } from "@expo/vector-icons";

// --- Constants ---
const PRIMARY_COLOR = "#007AFF"; 
const TEXT_COLOR = "#212121";
const SUBTLE_TEXT_COLOR = "#757575";
const ITEM_BACKGROUND = "#FFFFFF"; 
const BACKGROUND_COLOR = "#F4F4F4"; 

export default function ModeratorSeekersScreen() {
    const { moderatorId, name: moderatorName } = useLocalSearchParams(); 
    const [seekers, setSeekers] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!moderatorId) return;

        const fetchSeekers = async () => {
            try {
                // Call the new Laravel API endpoint
                const response = await api.get(`/zones/${moderatorId}/seekers`);
                setSeekers(response.data);
            } catch (error) {
                console.log("Error fetching assigned seekers:", error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchSeekers();
    }, [moderatorId]);

    // Handle pressing on a seeker (e.g., to view seeker details)
    const handleSeekerPress = (seekerId) => {
        // Example: Navigate to a seeker detail screen
        router.push(`/seeker/${seekerId}`);
    };

    if (loading) {
        return <ActivityIndicator style={styles.loader} size="large" color={PRIMARY_COLOR} />;
    }

    const EmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={40} color={SUBTLE_TEXT_COLOR} />
            <Text style={styles.emptyText}>No seekers are currently assigned to {moderatorName}.</Text>
        </View>
    );

     // Helper function for date formatting
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };
    
    return (
        <>
            <Stack.Screen
                options={{
                    title: `${moderatorName}'s Seekers`,
                }}
            />
            <View style={styles.container}>
                <FlatList
                    data={seekers}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.itemCard}
                            onPress={() => handleSeekerPress(item.id)}
                        >
                            <Ionicons name="person-outline" size={30} color={PRIMARY_COLOR} style={styles.seekerIcon} />

                            <View style={styles.itemContent}>
                                {/* Seeker Name */}
                                <Text style={styles.itemTitle}>
                                    {item.first_name} {item.last_name || ''}
                                </Text>
                                
                                {/* Seeker Mobile */}
                                <View style={styles.detailRow}>
                                    <Ionicons name="call-outline" size={14} color={SUBTLE_TEXT_COLOR} />
                                    <Text style={styles.itemSubtitle}>
                                        {item.mobile || 'N/A'}
                                    </Text>
                                </View>

                                {/* Last updated */}
                                <View style={styles.detailRow}>
                                    <Ionicons name="time-outline" size={14} color={SUBTLE_TEXT_COLOR} />
                                    <Text style={styles.itemSubtitle}>
                                    Last Updated: **{formatDate(item.updated_at) || 'N/A'}
                                    </Text>
                                </View>
                            </View>
                            
                            {/* Navigation Indicator */}
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
    seekerIcon: {
        marginRight: 15,
        opacity: 0.8,
    },
    itemContent: { flex: 1 },
    itemTitle: { fontSize: 16, fontWeight: "700", color: TEXT_COLOR, marginBottom: 5 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    itemSubtitle: { fontSize: 14, color: SUBTLE_TEXT_COLOR, marginLeft: 5 },
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