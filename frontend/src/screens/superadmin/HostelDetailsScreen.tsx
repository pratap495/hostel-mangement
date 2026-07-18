import React, { useState, useEffect } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppSelector } from '../../redux/store';
import { HostelStackParamList } from '../../navigation/SuperAdminNavigator';
import Header from '../../components/Header';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import TextInput from '../../components/TextInput';
import { hostelService } from '../../services/hostelService';
import { colors, radius, typography } from '../../theme';

type Props = NativeStackScreenProps<HostelStackParamList, 'HostelDetails'>;

export default function HostelDetailsScreen({ route, navigation }: Props) {
  const hostel = useAppSelector(state => state.hostels.hostels.find(item => item.id === route.params.hostelId));
  const owners = useAppSelector(state => state.owners.owners);
  const rooms = useAppSelector(state => state.rooms.rooms);
  const hostelers = useAppSelector(state => state.hostelers.hostelers);
  const transactions = useAppSelector(state => state.finance.transactions);
  const [loading, setLoading] = useState(false);

  // Reassign Owner Modal States
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [reason, setReason] = useState('');

  if (!hostel) return <View style={styles.center}><Text style={styles.errorText}>Hostel not found</Text></View>;

  const linkedOwner = owners.find(owner => owner.hostelsAssigned.includes(hostel.id));
  const owner = { name: hostel.ownerName || linkedOwner?.name || 'Not assigned', email: hostel.ownerEmail || linkedOwner?.email || 'Not available', phone: hostel.ownerPhone || linkedOwner?.phone || 'Not available' };
  const hostelRooms = rooms.filter(room => room.hostelId === hostel.id);
  const occupied = hostelRooms.length > 0
    ? hostelRooms.reduce((total, room) => total + room.occupiedCount, 0)
    : (hostel.occupiedBeds || 0);
  const totalHostelers = hostelers.some(hosteler => hosteler.hostelId === hostel.id)
    ? hostelers.filter(hosteler => hosteler.hostelId === hostel.id && hosteler.isActive).length
    : (hostel.totalHostelers || 0);
  const income = transactions.some(item => item.hostelId === hostel.id)
    ? transactions.filter(item => item.hostelId === hostel.id && item.type === 'income').reduce((total, item) => total + item.amount, 0)
    : (hostel.monthlyIncome || 0);

  const newOwnerEmail = (route.params as any)?.newOwnerEmail;

  // Auto-open modal when redirected back after creating a new owner
  useEffect(() => {
    if (newOwnerEmail && owners.length > 0) {
      const foundOwner = owners.find(o => o.email.trim().toLowerCase() === newOwnerEmail.trim().toLowerCase());
      if (foundOwner) {
        setSelectedOwnerId(foundOwner.id);
        setIsReassignModalOpen(true);
        navigation.setParams({ newOwnerEmail: undefined } as any);
      }
    }
  }, [newOwnerEmail, owners]);

  const toggleStatus = async () => {
    setLoading(true);
    try { await hostelService.toggleHostelStatus(hostel.id); }
    catch { Alert.alert('Error', 'Unable to update hostel status.'); }
    finally { setLoading(false); }
  };

  const selectedOwner = owners.find(o => o.id === selectedOwnerId);

  const filteredOwners = owners.filter(o =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.phone.includes(searchQuery) ||
    o.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirmReassign = async () => {
    if (!selectedOwnerId || !selectedOwner) {
      Alert.alert('Selection Required', 'Please select an owner to reassign.');
      return;
    }

    setLoading(true);
    try {
      await hostelService.updateHostel({
        ...hostel,
        ownerName: selectedOwner.name,
        ownerEmail: selectedOwner.email,
        ownerPhone: selectedOwner.phone,
      });

      setIsReassignModalOpen(false);
      setReason('');
      setSearchQuery('');
      setSelectedOwnerId(null);
      Alert.alert('Success', `Hostel owner reassigned to ${selectedOwner.name}.`);
    } catch {
      Alert.alert('Error', 'Unable to reassign owner.');
    } finally {
      setLoading(false);
    }
  };

  return <View style={styles.container}>
    <Header title="Hostel Details" showBack onBack={() => navigation.goBack()} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {hostel.imageUrl ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: hostel.imageUrl }} style={styles.bannerPhoto} resizeMode="cover" />
        </View>
      ) : null}

      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.name}>{hostel.name}</Text>
          <View style={styles.heroSubRow}>
            <View style={[styles.status, hostel.isActive ? styles.statusActive : styles.statusInactive]}>
              <View style={styles.dot} />
              <Text style={styles.statusText}>{hostel.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
            <Text style={styles.id}>ID: {hostel.id.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statGrid}>
        <Stat icon="bed-outline" label="Total Rooms" value={String(hostel.roomsCount)} suffix="Rooms" />
        <Stat icon="people-outline" label="Total Occupied" value={String(occupied)} suffix="Beds" />
        <Stat icon="cash-outline" label="Monthly Income" value={`₹${income.toLocaleString('en-IN')}`} suffix="Collected" />
        <Stat icon="person-outline" label="Total Hostelers" value={String(totalHostelers)} suffix="Hostelers" />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHead}><Text style={styles.cardTitle}>Hostel Information</Text><TouchableOpacity onPress={() => navigation.navigate('AddHostel', { hostelId: hostel.id })}><Text style={styles.edit}>Edit</Text></TouchableOpacity></View>
        <Detail icon="location-outline" label="Address" value={hostel.address} />
        <Detail icon="person-outline" label="Owner" value={owner.name} />
        <Detail icon="call-outline" label="Phone Number" value={hostel.contactNumber} />
        <Detail icon="mail-outline" label="Email" value={owner.email} />
        <Detail icon="business-outline" label="Total Floors" value={String(hostel.floorsCount)} />
        <Detail icon="bed-outline" label="Total Rooms" value={String(hostel.roomsCount)} />
        <Detail icon="people-outline" label="Total Occupied" value={String(occupied)} />
        <Detail icon="people-outline" label="Total Hostelers" value={String(totalHostelers)} last />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Owner Information</Text>
        <Detail icon="person-outline" label="Owner Name" value={owner.name} />
        <Detail icon="mail-outline" label="Email" value={owner.email} />
        <Detail icon="call-outline" label="Phone Number" value={owner.phone} last />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Actions</Text>
        <View style={styles.actions}>
          <PrimaryButton title="Edit Hostel" onPress={() => navigation.navigate('AddHostel', { hostelId: hostel.id })} style={styles.action} />
          <SecondaryButton title="Reassign Owner" onPress={() => setIsReassignModalOpen(true)} style={[styles.action, { borderColor: colors.gold }]} textStyle={{ color: colors.gold }} />
          <SecondaryButton title={hostel.isActive ? 'Deactivate' : 'Activate'} onPress={toggleStatus} loading={loading} textStyle={{ color: hostel.isActive ? colors.error : colors.success }} style={[styles.action, { borderColor: hostel.isActive ? colors.error : colors.success }]} />
        </View>
      </View>
    </ScrollView>

    {/* Reassign Owner Modal */}
    <Modal
      visible={isReassignModalOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsReassignModalOpen(false)}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboardContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reassign Owner</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsReassignModalOpen(false);
                  setSearchQuery('');
                  setSelectedOwnerId(null);
                  setReason('');
                }}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollBody} keyboardShouldPersistTaps="handled">
              {/* Current Owner Reference */}
              <Text style={styles.modalLabel}>Current Owner</Text>
              <View style={styles.currentOwnerCard}>
                <Text style={styles.currentOwnerName}>{owner.name}</Text>
                <Text style={styles.currentOwnerInfo}>{owner.email} • {owner.phone}</Text>
              </View>

              <Text style={styles.modalLabel}>Select New Owner</Text>
              {selectedOwner ? (
                <View style={styles.selectedOwnerCard}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} style={styles.checkmarkIcon} />
                  <View style={styles.ownerDetails}>
                    <Text style={styles.ownerNameText}>{selectedOwner.name}</Text>
                    <Text style={styles.ownerInfoText}>{selectedOwner.email}</Text>
                    <Text style={styles.ownerInfoText}>+91 {selectedOwner.phone}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changeBtn}
                    onPress={() => setSelectedOwnerId(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.changeBtnText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.ownerSelectionContainer}>
                  <View style={styles.searchRow}>
                    <View style={styles.searchFieldContainer}>
                      <TextInput
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChangeText={(text) => {
                          setSearchQuery(text);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.addOwnerInlineBtn}
                      onPress={() => {
                        setIsReassignModalOpen(false);
                        (navigation as any).navigate('AdminOwners', { 
                          screen: 'CreateOwner', 
                          params: { returnTo: 'HostelDetails', hostelId: hostel.id } 
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add-circle-outline" size={20} color={colors.gold} />
                      <Text style={styles.addOwnerInlineText}>New Owner</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Dropdown overlay/results */}
                  {showDropdown && searchQuery.length > 0 && (
                    <View style={styles.dropdown}>
                      {filteredOwners.slice(0, 5).map(o => (
                        <TouchableOpacity
                          key={o.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedOwnerId(o.id);
                            setSearchQuery('');
                            setShowDropdown(false);
                          }}
                        >
                          <View style={styles.dropdownDetails}>
                            <Text style={styles.dropdownName}>{o.name}</Text>
                            <Text style={styles.dropdownInfo}>{o.email} • {o.phone}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                      {filteredOwners.length === 0 && (
                        <View style={styles.dropdownEmpty}>
                          <Text style={styles.dropdownEmptyText}>No matching owners found</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Optional Reason Field */}
              <View style={{ marginTop: 14 }}>
                <TextInput
                  label="Reason for Reassignment (Optional)"
                  placeholder="e.g. Sold, Owner exited"
                  value={reason}
                  onChangeText={setReason}
                />
              </View>

              <PrimaryButton
                title="Confirm Reassign"
                onPress={handleConfirmReassign}
                loading={loading}
                style={styles.modalSubmitBtn}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  </View>;
}

function Stat({ icon, label, value, suffix }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; suffix: string }) {
  return <View style={styles.stat}><View style={styles.statIcon}><Ionicons name={icon} size={19} color={colors.gold} /></View><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text><Text style={styles.suffix}>{suffix}</Text></View>;
}

function Detail({ icon, label, value, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean }) {
  return <View style={[styles.detail, last && styles.detailLast]}><Ionicons name={icon} size={18} color={colors.gold} style={styles.detailIcon} /><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }, errorText: { color: colors.error, fontSize: typography.sizes.md }, content: { padding: 16, paddingBottom: 40 },
  imageContainer: { width: '100%', height: 200, borderRadius: radius.lg, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: colors.divider },
  bannerPhoto: { width: '100%', height: '100%' },
  hero: { backgroundColor: '#F6E9DC', borderRadius: radius.lg, padding: 16, marginBottom: 16 },
  heroText: { flex: 1 },
  name: { color: '#211A15', fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  heroSubRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  status: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm },
  statusActive: { backgroundColor: '#DDEAD9' }, statusInactive: { backgroundColor: '#F4D9DA' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  statusText: { color: '#246A2C', fontSize: typography.sizes.xs, fontWeight: typography.weights.bold },
  id: { color: '#796B60', fontSize: typography.sizes.xs },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }, stat: { width: '48%', backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider, padding: 12 }, statIcon: { height: 34, width: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(199,150,42,0.12)', marginBottom: 9 }, statLabel: { color: colors.textFaint, fontSize: typography.sizes.xs }, statValue: { color: colors.white, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, marginTop: 5 }, suffix: { color: colors.textFaint, fontSize: typography.sizes.xs, marginTop: 2 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.divider, padding: 16, marginBottom: 16 }, cardTitle: { color: colors.gold, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, marginBottom: 12 }, cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, edit: { color: colors.gold, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, marginBottom: 12 },
  detail: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.divider }, detailLast: { borderBottomWidth: 0 }, detailIcon: { width: 28 }, detailLabel: { color: colors.textMuted, fontSize: typography.sizes.sm, width: '31%' }, detailValue: { flex: 1, color: colors.white, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  actions: { flexDirection: 'row', gap: 8 }, 
  action: { flex: 1, height: 44, paddingHorizontal: 4 },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalKeyboardContainer: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingTop: 16,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    color: colors.gold,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScrollBody: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 4,
  },
  modalLabel: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginTop: 10,
    marginBottom: 8,
  },
  currentOwnerCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 14,
    marginBottom: 10,
  },
  currentOwnerName: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  currentOwnerInfo: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  ownerSelectionContainer: {
    position: 'relative',
    zIndex: 100,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchFieldContainer: {
    flex: 1,
  },
  addOwnerInlineBtn: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(199, 150, 42, 0.1)',
    borderWidth: 1,
    borderColor: colors.goldBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginTop: 6,
    gap: 6,
  },
  addOwnerInlineText: {
    color: colors.gold,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  dropdown: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    maxHeight: 180,
    overflow: 'hidden',
    zIndex: 999,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dropdownDetails: {
    gap: 3,
  },
  dropdownName: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  dropdownInfo: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
  },
  dropdownEmpty: {
    padding: 16,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    color: colors.textFaint,
    fontSize: typography.sizes.sm,
  },
  selectedOwnerCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  checkmarkIcon: {
    alignSelf: 'center',
  },
  ownerDetails: {
    flex: 1,
    gap: 3,
  },
  ownerNameText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  ownerInfoText: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
  },
  changeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  changeBtnText: {
    color: colors.gold,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  modalSubmitBtn: {
    marginTop: 24,
  },
});
