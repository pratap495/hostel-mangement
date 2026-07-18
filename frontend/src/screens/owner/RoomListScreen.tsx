import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppSelector } from '../../redux/store';
import { RoomStackParamList } from '../../navigation/OwnerNavigator';
import Header from '../../components/Header';
import RoomCard from '../../components/RoomCard';
import TextInput from '../../components/TextInput';
import Dropdown from '../../components/Dropdown';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import { roomService } from '../../services/roomService';
import { colors, typography, radius } from '../../theme';

type Props = NativeStackScreenProps<RoomStackParamList, 'RoomList'>;

export default function RoomListScreen({ navigation }: Props) {
  const { activeHostelId } = useAppSelector(state => state.auth);
  const rooms = useAppSelector(state => state.rooms.rooms);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'single' | 'double' | 'triple' | 'dormitory'>('all');

  // Add Room Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [roomType, setRoomType] = useState<'single' | 'double' | 'triple' | 'dormitory'>('single');
  const [capacity, setCapacity] = useState('2');
  const [monthlyRent, setMonthlyRent] = useState('6000');
  const [saving, setSaving] = useState(false);

  // Filter rooms for current active hostel
  const activeRooms = rooms.filter(r => r.hostelId === activeHostelId);

  // Stats calculation
  const totalBeds = activeRooms.reduce((acc, curr) => acc + curr.capacity, 0);
  const occupiedBeds = activeRooms.reduce((acc, curr) => acc + curr.occupiedCount, 0);
  const vacantBeds = totalBeds - occupiedBeds;

  const filteredRooms = activeRooms.filter(room => {
    const matchesSearch = room.roomNumber.includes(search);
    const matchesType = filterType === 'all' || room.roomType === filterType;
    return matchesSearch && matchesType;
  });

  const handleAddRoom = async () => {
    if (!roomNumber.trim() || !floorNumber.trim() || !capacity.trim() || !monthlyRent.trim()) {
      Alert.alert('Validation Error', 'Please fill in all details.');
      return;
    }
    
    setSaving(true);
    try {
      await roomService.createRoom({
        hostelId: activeHostelId || '',
        roomNumber: roomNumber.trim(),
        floorNumber: parseInt(floorNumber, 10),
        roomType,
        capacity: parseInt(capacity, 10),
        monthlyRent: parseFloat(monthlyRent),
      });
      setAddModalVisible(false);
      // Reset form
      setRoomNumber('');
      setFloorNumber('');
      setRoomType('single');
      setCapacity('2');
      setMonthlyRent('6000');
      Alert.alert('Success', 'Room created successfully.');
    } catch (err) {
      Alert.alert('Error', 'Unable to create room.');
    } finally {
      setSaving(false);
    }
  };

  const handleRoomTypeChange = (type: string) => {
    setRoomType(type as any);
    // Auto-fill capacity and rent defaults for speed
    if (type === 'single') { setCapacity('1'); setMonthlyRent('8500'); }
    else if (type === 'double') { setCapacity('2'); setMonthlyRent('6000'); }
    else if (type === 'triple') { setCapacity('3'); setMonthlyRent('4500'); }
    else if (type === 'dormitory') { setCapacity('6'); setMonthlyRent('3500'); }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Rooms setup"
        showDrawer
        onDrawer={() => (navigation as any).getParent()?.openDrawer()}
      />

      {/* Overview Card */}
      <View style={styles.overviewCard}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Total Beds</Text>
          <Text style={styles.statVal}>{totalBeds}</Text>
        </View>
        <View style={[styles.statCol, styles.borderLeft]}>
          <Text style={styles.statLabel}>Occupied</Text>
          <Text style={[styles.statVal, { color: colors.warmAttention }]}>{occupiedBeds}</Text>
        </View>
        <View style={[styles.statCol, styles.borderLeft]}>
          <Text style={styles.statLabel}>Vacant</Text>
          <Text style={[styles.statVal, { color: colors.goldLight }]}>{vacantBeds}</Text>
        </View>
      </View>

      {/* Search and Add */}
      <View style={styles.searchBarContainer}>
        <TextInput
          placeholder="Filter by Room #..."
          iconName="search-outline"
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.searchField}
          keyboardType="numeric"
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Type filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['all', 'single', 'double', 'triple', 'dormitory'] as const).map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, filterType === type && styles.filterChipActive]}
              onPress={() => setFilterType(type)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, filterType === type && styles.filterChipTextActive]}>
                {type.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Rooms list */}
      <FlatList
        data={filteredRooms}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <RoomCard
            room={item}
            onPress={() => navigation.navigate('RoomDetails', { roomId: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bed-outline" size={48} color={colors.textFaint} />
            <Text style={styles.emptyText}>No Rooms Found</Text>
            <Text style={styles.emptySubtext}>Add a new room or check filters.</Text>
          </View>
        }
      />

      {/* Add Room Modal */}
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Room</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close-outline" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <TextInput
                label="Room Number"
                placeholder="204"
                keyboardType="numeric"
                value={roomNumber}
                onChangeText={setRoomNumber}
              />

              <TextInput
                label="Floor Number"
                placeholder="2"
                keyboardType="numeric"
                value={floorNumber}
                onChangeText={setFloorNumber}
              />

              <Dropdown
                label="Room Type"
                items={[
                  { label: 'Single Occupancy', value: 'single' },
                  { label: 'Double Sharing', value: 'double' },
                  { label: 'Triple Sharing', value: 'triple' },
                  { label: 'Dormitory Setup', value: 'dormitory' },
                ]}
                selectedValue={roomType}
                onValueChange={handleRoomTypeChange}
              />

              <TextInput
                label="Beds Capacity"
                placeholder="2"
                keyboardType="numeric"
                value={capacity}
                onChangeText={setCapacity}
              />

              <TextInput
                label="Monthly Rent (₹)"
                placeholder="6000"
                keyboardType="numeric"
                value={monthlyRent}
                onChangeText={setMonthlyRent}
              />

              <View style={styles.modalActions}>
                <SecondaryButton
                  title="Cancel"
                  onPress={() => setAddModalVisible(false)}
                  style={styles.modalBtn}
                />
                <PrimaryButton
                  title="Save Room"
                  onPress={handleAddRoom}
                  loading={saving}
                  style={styles.modalBtn}
                />
              </View>
            </ScrollView>
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
  overviewCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  borderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: colors.divider,
  },
  statLabel: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
    marginBottom: 6,
  },
  statVal: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  searchField: {
    flex: 1,
    marginBottom: 0,
  },
  addBtn: {
    backgroundColor: colors.gold,
    width: 52,
    height: 52,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  filterContainer: {
    marginVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  filterChipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  filterChipText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginTop: 16,
  },
  emptySubtext: {
    color: colors.textFaint,
    fontSize: typography.sizes.sm,
    marginTop: 6,
    textAlign: 'center',
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
    maxHeight: '80%',
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
    marginBottom: 24,
  },
  modalBtn: {
    flex: 1,
  },
});
