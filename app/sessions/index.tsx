import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
// import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import ImageResizer from 'react-native-image-resizer';
import apiClient from '../../src/api/apiClient';

interface ScannedSeeker {
  name: string;
  mobile: string;
}

export default function SessionsScreen() {
  // const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);

  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seekers, setSeekers] = useState<ScannedSeeker[]>([]);
  const [selectedSession, setSelectedSession] = useState(1);

  /* -------------------- CAMERA + OCR -------------------- */

  const captureAndScan = async () => {
    if (!camera.current) return;
    setLoading(true);

    try {
      // 1️⃣ Take photo
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'speed',
        skipMetadata: true,
      });

      // 2️⃣ Resize image (VERY IMPORTANT)
      const resized = await ImageResizer.createResizedImage(
        Platform.OS === 'android' ? `file://${photo.path}` : photo.path,
        1280,
        1280,
        'JPEG',
        70
      );

      // 3️⃣ Prepare form data
      const formData = new FormData();
      formData.append('image', {
        uri: resized.uri,
        name: 'attendance.jpg',
        type: 'image/jpeg',
      } as any);

      // 4️⃣ Upload to Laravel
      const response = await apiClient.post('/scan-image', formData);

      if (response.data?.numbers?.length) {
        setSeekers(
          response.data.numbers.map((num: string) => ({
            name: 'Verify Name',
            mobile: num,
          }))
        );
        setShowCamera(false);
      } else {
        Alert.alert('No Numbers Found', 'Try scanning again with better lighting.');
      }
    } catch (error) {
      console.log('OCR ERROR FULL:', {
        message: error.message,
        code: error.code,
        isAxiosError: error.isAxiosError,
        request: error.request,
        response: error.response?.data,
        status: error.response?.status,
      });
    
      Alert.alert(
        'Scan Error',
        error.response?.data?.message || error.message
      );
    }
    
  };

  /* -------------------- SUBMIT ATTENDANCE -------------------- */

  const submitAttendance = async () => {
    setLoading(true);
    try {
      await apiClient.post('/mark-attendance', {
        session_number: selectedSession,
        seekers,
      });
      Alert.alert('Success', 'Attendance synced!');
      setSeekers([]);
    } catch (error) {
      Alert.alert('Server Error', 'Check Laravel connection.');
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- PERMISSION UI -------------------- */

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={styles.linkText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* -------------------- UI -------------------- */

  return (
    <View style={styles.container}>
      {showCamera ? (
        <View style={StyleSheet.absoluteFill}>
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device!}
            isActive={true}
            photo={true}
            enableAutoStabilization={true}
          />

          <View style={styles.overlay}>
            <Text style={styles.guideText}>Align names & numbers clearly</Text>
          </View>

          <TouchableOpacity
            style={styles.captureBtn}
            onPress={captureAndScan}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <View style={styles.innerCircle} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCamera(false)}>
            <Text style={styles.btnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.header}>Sessions</Text>

          <View style={styles.sessionGroup}>
            {[1, 2, 3].map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.chip, selectedSession === num && styles.activeChip]}
                onPress={() => setSelectedSession(num)}
              >
                <Text style={selectedSession === num ? styles.activeText : styles.inactiveText}>
                  Session {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.scanActionBtn} onPress={() => setShowCamera(true)}>
            <Text style={styles.scanActionText}>📷 Start New Scan</Text>
          </TouchableOpacity>

          {seekers.length > 0 && (
            <View style={styles.resultsCard}>
              <Text style={styles.resultsTitle}>Verify Scanned List ({seekers.length})</Text>

              {seekers.map((item, index) => (
                <View key={index} style={styles.row}>
                  <TextInput
                    style={styles.inputName}
                    value={item.name}
                    placeholder="Name"
                    onChangeText={(t) => {
                      const updated = [...seekers];
                      updated[index].name = t;
                      setSeekers(updated);
                    }}
                  />
                  <TextInput
                    style={styles.inputMobile}
                    value={item.mobile}
                    keyboardType="phone-pad"
                    onChangeText={(t) => {
                      const updated = [...seekers];
                      updated[index].mobile = t;
                      setSeekers(updated);
                    }}
                  />
                </View>
              ))}

              <TouchableOpacity style={styles.saveBtn} onPress={submitAttendance}>
                <Text style={styles.saveBtnText}>Save Attendance</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingTop: 50 },
  header: { fontSize: 28, fontWeight: '800', color: '#1F2937', marginBottom: 20 },
  sessionGroup: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#E5E7EB' },
  activeChip: { backgroundColor: '#3B82F6' },
  activeText: { color: '#FFF', fontWeight: 'bold' },
  inactiveText: { color: '#4B5563' },
  scanActionBtn: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
  },
  scanActionText: { color: '#3B82F6', fontWeight: 'bold', fontSize: 16 },
  captureBtn: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFF' },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: { color: '#FFF', fontSize: 20 },
  resultsCard: { marginTop: 20, backgroundColor: '#FFF', borderRadius: 15, padding: 15 },
  resultsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  inputName: { flex: 2, borderBottomWidth: 1, borderColor: '#D1D5DB', padding: 8 },
  inputMobile: { flex: 1.5, borderBottomWidth: 1, borderColor: '#D1D5DB', padding: 8 },
  saveBtn: { backgroundColor: '#10B981', padding: 15, borderRadius: 10, marginTop: 15 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  overlay: { position: 'absolute', top: '20%', width: '100%', alignItems: 'center' },
  guideText: { color: '#FFF', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 5 },
  linkText: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
});
