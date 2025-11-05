import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Alert,
  Button,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/apiClient";
import { useRouter } from "expo-router";

export default function UsersListScreen() {
  const [seekers, setSeekers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedSeekers, setSelectedSeekers] = useState([]);
  const [moderatorModalVisible, setModeratorModalVisible] = useState(false);
  const [moderators, setModerators] = useState([]);
  const [selectedModerator, setSelectedModerator] = useState(null);

  const [filters, setFilters] = useState({
    zone: "",
    type: "",
    interested_in_followup: null,
    attended_puja: null,
    attended_centres: null,
    attended_session_1: null,
    attended_session_2: null,
    attended_session_3: null,
    attended_session_4: null,
    month_1: "",
    month_2: "",
  });

  const fetchSeekers = async (filters = {}) => {
    try {
      const queryParams = Object.entries(filters)
        .filter(([_, value]) => value !== "" && value !== null)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join("&");
  
      const url = queryParams ? `/seekers?${queryParams}` : "/seekers";
  
      const response = await api.get(url);
      setSeekers(response.data);
    } catch (error) {
      console.error("Error fetching seekers:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchSeekers();
  }, []);

  const filteredSeekers = seekers.filter(
    (s) =>
      s.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.mobile?.includes(search)
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const handleApplyFilters = () => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== "" && v !== null)
    );
    setFilterVisible(false);
    fetchSeekers(params);
  };

  const handleReset = () => {
    setFilters({
      zone: "",
      type: "",
      interested_in_followup: null,
      attended_puja: null,
      attended_centres: null,
      entry_date: "",
      attended_session_1: null,
      attended_session_2: null,
      attended_session_3: null,
      attended_session_4: null,
    });
  };

  const applyFilters = async (filters) => {
    setFilterVisible(false);
  
    try {
      const response = await api.get("/seekers", { params: filters });
      setSeekers(response.data);
    } catch (error) {
      console.error("Error applying filters:", error.message);
    }
  };

  const toggleSelection = (id) => {
    setSelectedSeekers((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };
  
  const renderItem = ({ item }) => {
    const isSelected = selectedSeekers.includes(item.id);
  
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.selectedCard]}
        activeOpacity={0.9}
        onPress={() => router.push(`/seeker/${item.id}`)} // 👈 View details
      >
        <View style={styles.cardHeader}>
          {/* ✅ Checkbox */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => toggleSelection(item.id)} // 👈 toggle select
          >
            <Ionicons
              name={isSelected ? "checkbox-outline" : "square-outline"}
              size={24}
              color={isSelected ? "#2196F3" : "#aaa"}
            />
          </TouchableOpacity>
  
          {/* Avatar and info */}
          <Ionicons name="person-circle-outline" size={36} color="#2196F3" />
          <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={styles.name}>
              {item.first_name} {item.last_name}
            </Text>

            {/* 👇 Moderator status icon */}
            {item.moderator ? (
              <Ionicons name="person-outline" size={20} color="#4CAF50" />
            ) : (
              <Ionicons name="person-remove-outline" size={20} color="#F44336" />
            )}
          </View>
            <Text style={styles.city}>{item.zone}, {item.city || "City N/A"}</Text>           
          </View>
        </View>
  
        {/* <View style={styles.cardFooter}>
          <Ionicons name="call-outline" size={16} color="#555" />
          <Text style={styles.mobile}>{item.mobile}</Text>
        </View> */}
      </TouchableOpacity>
    );
  };
  

  const toggleSelect = (id) => {
    setSelectedSeekers((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };
  
  const fetchModerators = async () => {
    try {
      const response = await api.get("/users?role_id=1");
      setModerators(response.data);
    } catch (error) {
      console.error("Error fetching moderators:", error);
    }
  };
  
  const assignModerator = async () => {
    if (!selectedModerator) return Alert.alert("Please select a moderator");
  
    try {
      await api.post("/seekers/assign-moderator", {
        moderator_id: selectedModerator,
        seeker_ids: selectedSeekers,
      });
      Alert.alert("Success", "Moderator assigned successfully!");
      setModeratorModalVisible(false);
      setSelectedSeekers([]);
      fetchSeekers(); // refresh list
    } catch (error) {
      console.error("Error assigning moderator:", error);
      Alert.alert("Error", "Could not assign moderator.");
    }
  };
  

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons name="filter" size={18} color="#fff" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>


      </View>


      <FlatList
        data={filteredSeekers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchSeekers();
            }}
          />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {selectedSeekers.length > 0 && (
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => {
            fetchModerators();
            setModeratorModalVisible(true);
          }}
        >
          <Text style={styles.assignButtonText}>
            Assign Moderator ({selectedSeekers.length})
          </Text>
        </TouchableOpacity>
      )}

      {/* 🪟 Filter Modal */}
      <Modal visible={filterVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            {/* ✖ Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setFilterVisible(false)}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            
            {/* 👇 Scrollable Content */}
            <ScrollView style={{ flexGrow: 1 }}>
              <Text style={styles.modalTitle}>Filter Seekers</Text>


              <TextInput
                style={styles.searchBox}
                placeholder="Search by name or mobile..."
                value={search}
                onChangeText={setSearch}
              />

              <TextInput
                style={styles.input}
                placeholder="Zone"
                value={filters.zone}
                onChangeText={(text) => setFilters({ ...filters, zone: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Type (1=Pratishthan, 2=Public)"
                value={filters.type}
                onChangeText={(text) => setFilters({ ...filters, type: text })}
              />

              <View style={{ marginVertical: 10 }}>
                <Text style={{ fontWeight: "bold" }}>Interested in Follow-up</Text>
                <View style={{ flexDirection: "row", marginTop: 6 }}>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.interested_in_followup === true && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, interested_in_followup: true })}
                  >
                    <Text>Yes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.interested_in_followup === false && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, interested_in_followup: false })}
                  >
                    <Text>No</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.interested_in_followup === null && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, interested_in_followup: null })}
                  >
                    <Text>Don't Consider</Text>
                  </TouchableOpacity>
                </View>
              </View>


              <View style={{ marginVertical: 10 }}>
                <Text style={{ fontWeight: "bold" }}>Attended Puja</Text>
                <View style={{ flexDirection: "row", marginTop: 6 }}>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.attended_puja === true && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, attended_puja: true })}
                  >
                    <Text>Yes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.attended_puja === false && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, attended_puja: false })}
                  >
                    <Text>No</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.attended_puja === null && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, attended_puja: null })}
                  >
                    <Text>Don't Consider</Text>
                  </TouchableOpacity>
                </View>
              </View>


              <View style={{ marginVertical: 10 }}>
                <Text style={{ fontWeight: "bold" }}>Attended Centre</Text>
                <View style={{ flexDirection: "row", marginTop: 6 }}>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.attended_centres === true && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, attended_centres: true })}
                  >
                    <Text>Yes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.attended_centres === false && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, attended_centres: false })}
                  >
                    <Text>No</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.attended_centres === null && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, attended_centres: null })}
                  >
                    <Text>Don't Consider</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 🔹 Section 2: Checklist Filters */}
              <Text style={styles.sectionTitle}>Pratishthan Checklist Filters</Text>

              <View style={{ marginVertical: 10 }}>
                <Text style={{ fontWeight: "bold" }}>Attended 1st Session</Text>
                <View style={{ flexDirection: "row", marginTop: 6 }}>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.attended_session_1 === true && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, attended_session_1: true })}
                  >
                    <Text>Yes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.attended_session_1 === false && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, attended_session_1: false })}
                  >
                    <Text>No</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.attended_session_1 === null && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, attended_session_1: null })}
                  >
                    <Text>Don't Consider</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ marginVertical: 10 }}>
                <Text style={{ fontWeight: "bold" }}>Attended 2nd Session</Text>
                <View style={{ flexDirection: "row", marginTop: 6 }}>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.attended_session_2 === true && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, attended_session_2: true })}
                  >
                    <Text>Yes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.attended_session_2 === false && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, attended_session_2: false })}
                  >
                    <Text>No</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.attended_session_2 === null && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, attended_session_2: null })}
                  >
                    <Text>Don't Consider</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ marginVertical: 10 }}>
                <Text style={{ fontWeight: "bold" }}>Attended 3rd Session</Text>
                <View style={{ flexDirection: "row", marginTop: 6 }}>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.attended_session_3 === true && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, attended_session_3: true })}
                  >
                    <Text>Yes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.attended_session_3 === false && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, attended_session_3: false })}
                  >
                    <Text>No</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.attended_session_3 === null && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, attended_session_3: null })}
                  >
                    <Text>Don't Consider</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ marginVertical: 10 }}>
                <Text style={{ fontWeight: "bold" }}>Attended 4th Session</Text>
                <View style={{ flexDirection: "row", marginTop: 6 }}>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.attended_session_4 === true && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, attended_session_4: true })}
                  >
                    <Text>Yes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.attended_session_4 === false && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, attended_session_4: false })}
                  >
                    <Text>No</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.attended_session_4 === null && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, attended_session_4: null })}
                  >
                    <Text>Don't Consider</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* <TextInput
                style={styles.input}
                placeholder="Entry Date (YYYY-MM-DD)"
                value={filters.entry_date}
                onChangeText={(text) =>
                  setFilters({ ...filters, entry_date: text })
                }
              /> */}

              <View style={styles.modalButtons}>
                <Button title="Reset" color="#888" onPress={handleReset} />
                <Button title="Apply" onPress={handleApplyFilters} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>


      <Modal visible={moderatorModalVisible} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Moderator</Text>

          <ScrollView>
            {moderators.map((mod) => (
              <TouchableOpacity
                key={mod.id}
                style={[
                  styles.moderatorItem,
                  mod.id === selectedModerator && styles.selectedModerator,
                ]}
                onPress={() => setSelectedModerator(mod.id)}
              >
                <Text>{mod.name}</Text>
                <Text style={styles.subText}>{mod.zone}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalButtons}>
            <Button title="Save" onPress={assignModerator} />
            <Button title="Cancel" color="gray" onPress={() => setModeratorModalVisible(false)} />
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 15 },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  searchBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#E3F2FD",
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 18, fontWeight: "bold" },
  city: { fontSize: 14, color: "#666" },
  cardFooter: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  mobile: { fontSize: 14, marginLeft: 6, color: "#333" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  
  filterText: {
    color: "#fff",
    marginLeft: 5,
    fontWeight: "500",
    fontSize: 14,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "80%", // give enough height for scrolling
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  closeButton: { fontSize: 22, color: "#999" },
  section: { marginVertical: 10 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  footer: {
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  closeButton: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 10,
    backgroundColor: "#f1f1f1",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  closeText: {
    fontSize: 18,
    color: "#333",
    fontWeight: "600",
  },
  filterOption: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  selectedOption: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 8,
    color: "#1565C0",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 4,
  },
  selectedCard: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
    borderWidth: 1,
  },
  assignButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  assignButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContent: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  moderatorItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  selectedModerator: {
    backgroundColor: "#E3F2FD",
  },
  selectedCard: {
    backgroundColor: "#F0F9FF",
  },
  row: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "500" },
  subText: { fontSize: 13, color: "#555" },
    checkboxContainer: {
      marginRight: 8,
    },
    selectedCard: {
      backgroundColor: "#E3F2FD",
      borderColor: "#2196F3",
      borderWidth: 1,
    },
    assignButton: {
      backgroundColor: "#2196F3",
      padding: 12,
      margin: 10,
      borderRadius: 8,
      alignItems: "center",
    },
    assignButtonText: {
      color: "#fff",
      fontWeight: "600",
    },
});
  