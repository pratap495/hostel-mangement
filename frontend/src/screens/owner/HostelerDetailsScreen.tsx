import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppSelector } from '../../redux/store';
import { HostelerStackParamList } from '../../navigation/OwnerNavigator';
import Header from '../../components/Header';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import TextInput from '../../components/TextInput';
import { hostelerService } from '../../services/hostelerService';
import { colors, typography, radius, images } from '../../theme';

type Props = NativeStackScreenProps<HostelerStackParamList, 'HostelerDetails'>;

export default function HostelerDetailsScreen({ route, navigation }: Props) {
  const { hostelerId } = route.params;
  const hostelers = useAppSelector(state => state.hostelers.hostelers);
  const rooms = useAppSelector(state => state.rooms.rooms);
  
  const [vacateModalVisible, setVacateModalVisible] = useState(false);
  const [vacateDate, setVacateDate] = useState(new Date().toISOString().split('T')[0]);
  const [vacateReason, setVacateReason] = useState('');
  const [vacating, setVacating] = useState(false);

  const hosteler = hostelers.find(h => h.id === hostelerId);
  const room = rooms.find(r => r.id === hosteler?.roomId);

  if (!hosteler) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Resident profile not found</Text>
      </View>
    );
  }

  const handleVacate = async () => {
    if (!vacateReason.trim()) {
      Alert.alert('Validation Error', 'Please enter a reason for vacating.');
      return;
    }
    setVacating(true);
    try {
      await hostelerService.vacateHosteler(hostelerId, vacateDate, vacateReason);
      setVacateModalVisible(false);
      Alert.alert('Vacated Successfully', `${hosteler.name} has vacated the hostel.`);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to vacate resident.');
    } finally {
      setVacating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={hosteler.name}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {hosteler.photoUrl ? (
              <Image source={{ uri: hosteler.photoUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {hosteler.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
              </Text>
            )}
          </View>
          <Text style={styles.name}>{hosteler.name}</Text>
          <Text style={styles.roomBadge}>
            {room ? `Room ${room.roomNumber} (Floor ${room.floorNumber})` : 'Archived/Vacated'}
          </Text>
        </View>

        {/* Contact Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoVal}>{hosteler.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoVal}>{hosteler.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Permanent Address</Text>
            <Text style={styles.infoVal}>{hosteler.permanentAddress}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date of Joining</Text>
            <Text style={styles.infoVal}>{hosteler.joiningDate}</Text>
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Emergency Contact</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contact Person</Text>
            <Text style={styles.infoVal}>{hosteler.emergencyContactName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Emergency Phone</Text>
            <Text style={styles.infoVal}>{hosteler.emergencyContactPhone}</Text>
          </View>
        </View>

        {/* Aadhaar Documents */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Aadhaar Card Verification</Text>
          <View style={styles.documentRow}>
            <View style={styles.docCol}>
              <Text style={styles.docLabel}>Front Side</Text>
              <Image
                source={{ uri: hosteler.aadhaarFrontUrl || images.aadhaarFrontPlaceholder }}
                style={styles.documentImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.docCol}>
              <Text style={styles.docLabel}>Back Side</Text>
              <Image
                source={{ uri: hosteler.aadhaarBackUrl || images.aadhaarBackPlaceholder }}
                style={styles.documentImage}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>

        {/* History info if vacated */}
        {!hosteler.isActive && (
          <View style={[styles.card, styles.vacatedCard]}>
            <Text style={[styles.cardTitle, { color: colors.error }]}>Vacation Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vacated Date</Text>
              <Text style={styles.infoVal}>{hosteler.vacateDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reason</Text>
              <Text style={styles.infoVal}>{hosteler.vacateReason}</Text>
            </View>
          </View>
        )}

        {/* Actions (Enabled only for active hostelers) */}
        {hosteler.isActive && (
          <View>
            <View style={styles.actions}>
              <PrimaryButton
                title="Edit Details"
                onPress={() => navigation.navigate('AddHosteler', { hostelerId: hosteler.id })}
                style={styles.actionBtn}
              />
              <SecondaryButton
                title="Transfer Room"
                onPress={() => navigation.navigate('OwnerRooms' as any, { screen: 'AllocateRoom', params: { hostelerId } })}
                style={styles.actionBtn}
              />
            </View>

            <SecondaryButton
              title="Vacate Resident"
              onPress={() => setVacateModalVisible(true)}
              textStyle={{ color: colors.error }}
              style={styles.vacateBtn}
            />
          </View>
        )}
      </ScrollView>

      {/* Vacate Modal Popup */}
      <Modal
        visible={vacateModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVacateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vacate Resident</Text>
              <TouchableOpacity onPress={() => setVacateModalVisible(false)}>
                <Ionicons name="close-outline" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <TextInput
                label="Vacate Date (YYYY-MM-DD)"
                placeholder="2026-07-10"
                value={vacateDate}
                onChangeText={setVacateDate}
              />
              
              <TextInput
                label="Reason for Vacating"
                placeholder="Completed college / Job transfer"
                value={vacateReason}
                onChangeText={setVacateReason}
              />
              
              <View style={styles.modalActions}>
                <SecondaryButton
                  title="Cancel"
                  onPress={() => setVacateModalVisible(false)}
                  style={styles.modalBtn}
                />
                <PrimaryButton
                  title="Confirm Vacate"
                  onPress={handleVacate}
                  loading={vacating}
                  style={styles.modalBtn}
                  textStyle={{ color: colors.white }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(199, 150, 42, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.gold,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  name: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  roomBadge: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
    marginBottom: 16,
  },
  vacatedCard: {
    borderColor: 'rgba(211, 47, 47, 0.4)',
    backgroundColor: 'rgba(211, 47, 47, 0.02)',
  },
  cardTitle: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
    marginBottom: 4,
  },
  infoVal: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  documentRow: {
    flexDirection: 'row',
    gap: 16,
  },
  docCol: {
    flex: 1,
  },
  docLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginBottom: 6,
  },
  documentImage: {
    width: '100%',
    height: 100,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
  },
  vacateBtn: {
    width: '100%',
    borderColor: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  modalTitle: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  modalBody: {
    padding: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
  },
});
