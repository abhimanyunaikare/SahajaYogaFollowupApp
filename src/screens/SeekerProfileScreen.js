import React, { useEffect, useState, useLayoutEffect } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import api from "../api/apiClient";

export default function SeekerProfileScreen() {
  const [seeker, setSeeker] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const { id } = useLocalSearchParams(); // gets [id] from /seeker/[id]
  const router = useRouter();

  useEffect(() => {
    const fetchSeeker = async () => {
      try {
        const response = await api.get(`/seekers/${id}`);
        setSeeker(response.data);
      } catch (error) {
        console.log("Error fetching seeker:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSeeker();
  }, [id]);

   // 👇 Add the edit button on the top-right
   useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push(`/seeker/edit/${id}`)}
          style={{ marginRight: 15 }}
        >
          <Text style={{ color: "#007AFF", fontWeight: "600" }}>Edit</Text>
        </TouchableOpacity>
      ),
      title: "Seeker Details",
    });
  }, [navigation, id]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!seeker) {
    return (
      <View style={styles.loader}>
        <Text>No seeker found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>

        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{seeker.first_name} {seeker.last_name}</Text>

            <View style={styles.card}>
                <View style={styles.section}>
                    <Text style={styles.label}>Mobile:</Text>
                    <Text style={styles.value}>{seeker.mobile}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{seeker.email || "N/A"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>City:</Text>
                    <Text style={styles.value}>{seeker.city || "N/A"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Zone:</Text>
                    <Text style={styles.value}>{seeker.zone || "N/A"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Type:</Text>
                    <Text style={styles.value}>{seeker.type === 1 ? "Pratishthan" : "Public Program"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Occupation:</Text>
                    <Text style={styles.value}>{seeker.occupation || "N/A"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Interested in Follow-up:</Text>
                    <Text style={styles.value}>{seeker.follow_up ? "Yes" : "No"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Entry Date:</Text>
                    <Text style={styles.value}>{seeker.created_at || "N/A"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Updated Date:</Text>
                    <Text style={styles.value}>{seeker.updated_at || "N/A"}</Text>
                </View>
            </View>

            <Text style={styles.checklistTitle}>Checklist</Text>
            
            {/* 👇 Edit Checklist button */}
            <TouchableOpacity
            style={styles.editChecklistButton}
            onPress={() => router.push(`/seeker/checklist/${id}`)}
            >
                <Text style={styles.editChecklistText}>Edit Checklist</Text>
            </TouchableOpacity>

            <View style={styles.card}>
                <Text style={styles.sectonlabel}>PRATISHTHAN SESSIONS:</Text>
                
                <View style={styles.section}>
                    <Text style={styles.label}>Attended 1st Session:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].attended_session_1 ? "Yes" : "No"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>1st Session Comments:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].session_1_comments || "N/A"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Attended 2nd Session:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].attended_session_2 ? "Yes" : "No"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>2nd Session Comments:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].session_2_comments || "N/A"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Attended 3rd Session:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].attended_session_3 ? "Yes" : "No"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>3rd Session Comments:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].session_3_comments || "N/A"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Attended 4th Session:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].attended_session_4 ? "Yes" : "No"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>4th Session Comments:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].session_4_comments || "N/A"}</Text>
                </View>
            </View>

            <View style={styles.cardChecklist}>

                <View style={styles.section}>
                    <Text style={styles.label}>Feeling Vibrations:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].feeling_vibrations ? "Yes" : "No"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Attended Center:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].attended_centres ? "Yes" : "No"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Attended Seminar:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].attended_seminar ? "Yes" : "No"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Attended Puja:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].attended_puja ? "Yes" : "No"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Attended 1st Month:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].month_1 ? "Yes" : "No"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>1st Month Comments:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].month_1_comments || "N/A"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Attended 2nd Month:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].month_2 ? "Yes" : "No"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>2nd Month Comments:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].month_2_comments || "N/A"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Attended 3rd Month:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].month_3 ? "Yes" : "No"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>3rd Month Comments:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].month_3_comments || "N/A"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Attended 4th Month:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].month_4 ? "Yes" : "No"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>4th Month Comments:</Text>
                    <Text style={styles.value}>{seeker.checklist[0].month_4_comments || "N/A"}</Text>
                </View>
            </View>
        </ScrollView>
    </View>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  card: {
    backgroundColor: "#E3F2FD",
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  cardChecklist: {
    backgroundColor: "#f5e3fd",
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  section: { marginBottom: 12 },
  label: { fontSize: 16, fontWeight: "600", color: "#333" },
  sectonlabel: { fontSize: 16, fontWeight: "300", color: "#33334", paddingBottom: 12 },
  value: { fontSize: 16, color: "#555", marginTop: 2 },
  checklistTitle: { fontSize: 20, fontWeight: "bold", marginTop: 20, marginBottom: 10 },
  checklistItem: { padding: 10, backgroundColor: "#E3F2FD", borderRadius: 8, marginBottom: 8 },
  editChecklistButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  editChecklistText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  checklistTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  checklistItem: {
    padding: 10,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    marginBottom: 8,
  },
  
});
