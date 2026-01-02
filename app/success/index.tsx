import React, { useEffect, useState, useContext, useCallback } from "react";
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
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from '../../src/api/apiClient';
import { AuthContext } from "../../src/context/AuthContext";
import { useRouter, Stack } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';

const PRIMARY_COLOR = "#007AFF"; 
const BACKGROUND_COLOR = "#F9F9F9";
const CARD_BACKGROUND = "#FFFFFF";

// Simple Card (No Checkbox)
const EstablishedSeekerCard = React.memo(({ item, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
                <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
                <Ionicons name="checkmark-done-circle" size={20} color="#4CAF50" />
            </View>
            <View style={styles.detailsRow}>
                <Ionicons name="location-outline" size={12} color="#6B7280" />
                <Text style={styles.locationText}> {item.zone?.name}, {item.city || "N/A"}</Text>
                <Ionicons name="call-outline" size={12} color="#6B7280" style={{marginLeft: 15}} />
                <Text style={styles.mobileText}> {item.mobile}</Text>
            </View>
            <View style={styles.typeBadgeContainer}>
                <Text style={styles.typeBadgeText}>
                    {item.type === 1 ? 'Pratishthan' : 'Public'}
                </Text>
            </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
    </TouchableOpacity>
));

export default function EstablishedSeekersScreen() {
  const [seekers, setSeekers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTypeTab, setActiveTypeTab] = useState("all");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const { user } = useContext(AuthContext);
  const router = useRouter();

  // Load Data
  const fetchEstablished = async (type = activeTypeTab) => {
    setLoading(true);
    try {
      // is_established=1 filter backend ko batayega ki sirf successfully follow-up wale dikhao
      let url = `/seekers?is_established=1&zone_id=${user.zone_id}&id=${user.id}&role_id=${user.role_id}`;
      if (type !== "all") url += `&type=${type}`;
      if (searchText) url += `&name=${searchText}`;

      const response = await api.get(url);
      setSeekers(response.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchEstablished(); }, [searchText]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
          title: "Established Seekers",
          headerRight: () => (
            <TouchableOpacity onPress={() => setIsSearchVisible(!isSearchVisible)} style={{marginRight: 15}}>
                <Ionicons name="search" size={24} color={PRIMARY_COLOR} />
            </TouchableOpacity>
          )
      }} />

      {isSearchVisible && (
          <View style={styles.searchBar}>
              <TextInput 
                placeholder="Search name..." 
                style={styles.input} 
                value={searchText}
                onChangeText={setSearchText}
              />
          </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {["all", "1", "2"].map((t) => (
          <TouchableOpacity 
            key={t} 
            style={[styles.tab, activeTypeTab === t && styles.activeTab]}
            onPress={() => { setActiveTypeTab(t); fetchEstablished(t); }}
          >
            <Text style={activeTypeTab === t ? styles.activeTabText : styles.tabText}>
                {t === "all" ? "All" : t === "1" ? "Pratishthan" : "Public"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={seekers}
        renderItem={({ item }) => (
          <EstablishedSeekerCard 
            item={item} 
            onPress={() => router.push(`/seeker/${item.id}`)} 
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchEstablished()} />}
        ListEmptyComponent={<Text style={styles.empty}>No established seekers found.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  card: {
    backgroundColor: CARD_BACKGROUND,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    elevation: 2,
  },
  infoContainer: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  name: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  detailsRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 13, color: '#6B7280' },
  mobileText: { fontSize: 13, color: '#6B7280' },
  tabs: { flexDirection: 'row', backgroundColor: '#E0F7FA', margin: 10, borderRadius: 8, padding: 2 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 6 },
  activeTab: { backgroundColor: '#FFF' },
  tabText: { color: '#00BCD4', fontWeight: '500' },
  activeTabText: { color: PRIMARY_COLOR, fontWeight: '700' },
  typeBadgeContainer: { backgroundColor: '#F3F4F6', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 8 },
  typeBadgeText: { fontSize: 11, color: '#4B5563', fontWeight: '600' },
  searchBar: { padding: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EEE' },
  input: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 8 },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' }
});