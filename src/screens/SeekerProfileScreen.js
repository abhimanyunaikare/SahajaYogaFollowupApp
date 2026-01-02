import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useState, useCallback , useContext} from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View , Linking} from "react-native";
import api from "../api/apiClient";
// Import useFocusEffect from the underlying React Navigation package
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons'; 
import { AuthContext } from "../../src/context/AuthContext";

// Helper component for displaying Yes/No status as a badge
const StatusBadge = ({ isTrue }) => (
  <View style={[styles.statusBadge, isTrue ? styles.statusYes : styles.statusNo]}>
    <Text style={styles.badgeText}>{isTrue ? "Yes" : "No"}</Text>
  </View>
);

// Helper component for the main profile sections with icons
const ProfileDetail = ({ iconName, label, value }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailContent}>
      <Ionicons name={iconName} size={20} color="#007AFF" style={styles.detailIcon} />
      <View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  </View>
);

// Helper component for checklist items
const ChecklistItem = ({ label, isTrue, comment }) => (
  <View style={styles.checklistItem}>
    <View style={styles.checklistRow}>
      <Text style={styles.checklistLabel}>{label}</Text>
      <StatusBadge isTrue={isTrue} />
    </View>
    {comment && comment !== "N/A" && (
      <View style={styles.commentContainer}>
        <FontAwesome5 name="comment-dots" size={14} color="#555" />
        <Text style={styles.commentText}>{comment}</Text>
      </View>
    )}
  </View>
);

// Function to handle the call action
const handleCall = (phoneNumber) => {
  // Format the number to ensure it has the 'tel:' scheme
  const url = `tel:${phoneNumber}`;
  
  // Check if the device can open the URL (i.e., make calls)
  Linking.canOpenURL(url)
    .then(supported => {
      if (!supported) {
        Alert.alert('Error', 'Phone calls are not supported on this device.');
      } else {
        return Linking.openURL(url);
      }
    })
    .catch(err => console.error('An error occurred', err));
};

export default function SeekerProfileScreen() {
  const [seeker, setSeeker] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();const { user } = useContext(AuthContext);

  // Use optional chaining and ensure we have an array before calling .includes
  // const canEditSeeker = Array.isArray(user?.permissions) && 
  //                       user?.permissions_map?.edit_seeker && 
  //                       user.permissions.includes(user.permissions_map.edit_seeker);
                        
  const { id } = useLocalSearchParams(); // gets [id] from /seeker/[id]
  const router = useRouter();

  // Helper function to fetch the seeker data
  const fetchSeeker = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/seekers/${id}`);
      console.log(response.data);

      setSeeker(response.data);        
    } catch (error) {
      console.error("Error fetching seeker:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 FIX: Use useFocusEffect instead of useEffect
  // This hook runs every time the screen comes into focus (initial load and navigating back)
  useFocusEffect(
    // Wrap the fetch call in useCallback to prevent infinite re-renders
    useCallback(() => {
      fetchSeeker();
      
      // Return an optional cleanup function
      return () => {
        // Any cleanup logic goes here
      };
    }, [id]) // Re-run if ID changes
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* ✏️ Edit Button */}
          <TouchableOpacity
            onPress={() => router.push(`/seeker/edit/${id}`)}
            style={{ marginRight: 10 }}
          >
            <Ionicons name="create-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      ),
      title: "Seeker Details",
    });
  }, [navigation, id, router]); // Added router dependency

  // Helper function for date formatting
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
  };
  
  // Conditionally render based on loading/data status
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!seeker) {
    return (
      <View style={styles.loader}>
        <Text style={styles.noSeekerText}>No seeker found</Text>
      </View>
    );
  }

  const checklist = seeker.checklist || {};

  return (
    <View style={{ flex: 1, backgroundColor: "#F9F9F9" }}>

        <ScrollView 
          style={styles.container} 
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
            {/* --- Main Profile Section --- */}
            <Text style={styles.title}>{seeker.first_name} {seeker.last_name}</Text>

            <View style={styles.card}>
            <TouchableOpacity 
                // Add the onPress handler here, passing the mobile number
                onPress={() => handleCall(seeker.mobile)}
                // Optional: Add a style to make it look clickable, if needed
                style={{ paddingVertical: 5 }} 
            >
                <ProfileDetail 
                    iconName="call-outline" 
                    label="Mobile" 
                    value={seeker.mobile} 
                    valueStyle={styles.mobileNumber}
                />
            </TouchableOpacity>
              
              <View style={styles.separator} />

              <ProfileDetail 
                iconName="body-outline" 
                label="Gender" 
                value={seeker.sex || "N/A"} 
              />
              <ProfileDetail 
                iconName="calendar-outline" 
                label="Age range" 
                value={seeker.age_range+" (years)" || "N/A"} 
              />
              <ProfileDetail 
                iconName="location-outline" 
                label="Area" 
                value={seeker.area?.name  || "N/A"} 
              />
              <ProfileDetail 
                iconName="map-outline" 
                label="Zone" 
                value={seeker.zone?.name || "N/A"} 
              />
              <ProfileDetail 
                iconName="business-outline" 
                label="Type" 
                value={seeker.type === 1 ? "Pratishthan Seeker" : "Public Program Seeker"} 
              />
              <ProfileDetail 
                iconName="briefcase-outline" 
                label="Occupation" 
                value={seeker.occupation || "N/A"} 
              />
              
              <View style={styles.separator} />

              <ProfileDetail 
                iconName="person-circle-outline" 
                label="Sahajayogi Responsible" 
                value={seeker.moderator ? seeker.moderator.name : 'Mentor not assigned'} 
              />
              
              <ProfileDetail 
                iconName="reader-outline" 
                label="Comment" 
                value={seeker.comment || "N/A"} 
              />
              
              <View style={styles.dateInfo}>
                <Text style={styles.dateText}>
                  Created Date: {formatDate(seeker.created_at)}
                </Text>
                <Text style={styles.dateText}>
                  - By: {seeker.creator?.name} ({seeker.creator?.zone?.name}) 
                </Text>
                <Text style={styles.dateText}>
                  Last Updated: {formatDate(seeker.updated_at)}
                </Text>
                <Text style={styles.dateText}>
                  - By: {seeker.lastupdator?.name} ({seeker.lastupdator?.role?.name})
                </Text>
              </View>
              
            </View>

            {/* --- Follow-up & Checklist Button --- */}
            <View style={styles.followUpContainer}>
                <Text style={styles.followUpLabel}>Interested in Sahajayoga & followup:</Text>
                <StatusBadge isTrue={seeker.interested_in_followup} />
            </View>

            {user?.permissions?.includes(2) && (
                <TouchableOpacity
                    style={styles.editChecklistButton}
                    onPress={() => router.push(`/seeker/checklist/${id}?name=${seeker.first_name}`)}
                >
                    <MaterialIcons name="playlist-add-check" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.editChecklistText}>Edit Checklist</Text>
                </TouchableOpacity>
            )}
           
            {/* --- Checklist - Pratishthan Sessions --- */}
            <Text style={styles.sectionHeader}>🧘 Pratishthan Session Updates (Yuva for Pratishthan)</Text>
            <Text style={styles.dateText}>(You can add comments after each session)</Text>
            

            <View style={styles.checklistCard}>
                <ChecklistItem 
                    label="Attended 1st Session" 
                    isTrue={checklist.attended_session_1} 
                    comment={checklist.session_1_comments} 
                />
                <ChecklistItem 
                    label="Attended 2nd Session" 
                    isTrue={checklist.attended_session_2} 
                    comment={checklist.session_2_comments} 
                />
                <ChecklistItem 
                    label="Attended 3rd Session" 
                    isTrue={checklist.attended_session_3} 
                    comment={checklist.session_3_comments} 
                />
                <ChecklistItem 
                    label="Attended 4th Session" 
                    isTrue={checklist.attended_session_4} 
                    comment={checklist.session_4_comments} 
                />
            </View>

            {/* --- Checklist - General & Monthly Follow-up --- */}
            <Text style={styles.sectionHeader}>✅ General Follow-up (Mentors)</Text>
            <View style={styles.checklistCardSecondary}>
                <ChecklistItem 
                    label="Feeling Vibrations" 
                    isTrue={checklist.feeling_vibrations} 
                />
                <ChecklistItem 
                    label="Meditating at Home" 
                    isTrue={checklist.meditating_at_home} 
                />
                <ChecklistItem 
                    label="Footsoak at Home" 
                    isTrue={checklist.footsoak_at_home} 
                />
                <ChecklistItem 
                    label="Shri Mataji's Photo at Home" 
                    isTrue={checklist.photo_at_home} 
                />
                <ChecklistItem 
                    label="Check Puja arranged at Home" 
                    isTrue={checklist.alter_check_at_home} 
                />
                <ChecklistItem 
                    label="Attending Center" 
                    isTrue={checklist.attended_centres} 
                />
                <ChecklistItem 
                    label="Attended Seminar" 
                    isTrue={checklist.attended_seminar} 
                />
                <ChecklistItem 
                    label="Attended Puja" 
                    isTrue={checklist.attended_puja} 
                />
            </View>

            <Text style={styles.sectionHeader}>🗓️ Monthly Follow-up (Mentors)</Text>
            <View style={styles.checklistCardSecondary}>
                <ChecklistItem 
                    label="Attended 1st Month" 
                    isTrue={checklist.month_1} 
                    comment={checklist.month_1_comments} 
                />
                <ChecklistItem 
                    label="Attended 2nd Month" 
                    isTrue={checklist.month_2} 
                    comment={checklist.month_2_comments} 
                />
                <ChecklistItem 
                    label="Attended 3rd Month" 
                    isTrue={checklist.month_3} 
                    comment={checklist.month_3_comments} 
                />
                <ChecklistItem 
                    label="Attended 4th Month" 
                    isTrue={checklist.month_4} 
                    comment={checklist.month_4_comments} 
                />
            </View>


            <Text style={styles.sectionHeader}>🗓️ After 4th Months Review (Mentors)</Text>
            <View style={styles.checklistCardSecondary}>
              <ChecklistItem 
                      label="Has He/She become a Sahajayogi?" 
                      isTrue={checklist.established} 
                  />              
            </View>
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 20, backgroundColor: "#F9F9F9" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  noSeekerText: { fontSize: 18, color: "#555" },
  
  // --- Main Profile Card Styling ---
  title: { 
    fontSize: 28, 
    fontWeight: "bold", 
    color: "#1A237E", // Deep Indigo for prominence
    marginBottom: 15 
  },
  card: {
    backgroundColor: "#FFFFFF", // White card background
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  detailContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 15,
    width: 20, // ensure consistent spacing for icon
  },
  detailLabel: { 
    fontSize: 14, 
    fontWeight: "500", 
    color: "#616161" // Greyish label
  },
  detailValue: { 
    fontSize: 16, 
    color: "#212121", 
    marginTop: 2, 
    fontWeight: "600" 
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  dateInfo: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  dateText: { 
    fontSize: 13, 
    color: "#757575", 
    marginBottom: 4 
  },

  // --- Follow-up & Button Styling ---
  followUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#FFFDE7', // Light yellow for attention
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#FFC107',
  },
  followUpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  editChecklistButton: {
    backgroundColor: "#007AFF", // Standard iOS Blue
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
  },
  editChecklistText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  // --- Checklist Styling ---
  sectionHeader: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#424242", 
    marginTop: 15, 
    marginBottom: 10 
  },
  checklistCard: {
    backgroundColor: "#E8F5E9", // Very light green for Pratishthan
    borderRadius: 14,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
  },
  checklistCardSecondary: {
    backgroundColor: "#E3F2FD", // Very light blue for General/Monthly
    borderRadius: 14,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
  },
  checklistItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CFD8DC',
  },
  checklistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checklistLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    flexShrink: 1,
    marginRight: 10,
  },
  
  // Badge Styling
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    minWidth: 50,
    alignItems: 'center',
  },
  statusYes: {
    backgroundColor: "#4CAF50", // Green
  },
  statusNo: {
    backgroundColor: "#F44336", // Red
  },
  badgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },

  // Comment Styling
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CFD8DC',
    marginLeft: 5,
    paddingLeft: 5,
  },
  commentText: {
    fontSize: 13,
    color: '#555',
    marginLeft: 8,
    fontStyle: 'italic',
    flexShrink: 1,
  },
  mobileNumber: {
    color: '#007AFF',             // Use a link color (iOS blue)
    textDecorationLine: 'underline', // Add the underline cue
    fontWeight: '600',
},
});