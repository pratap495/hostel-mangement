import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { hostelService } from '../../services/hostelService';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import Dropdown from '../../components/Dropdown';
import { colors, typography, radius } from '../../theme';

export default function OwnerDashboardScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { user, activeHostelId } = useAppSelector(state => state.auth);
  const hostels = useAppSelector(state => state.hostels.hostels);
  const rooms = useAppSelector(state => state.rooms.rooms);
  const hostelers = useAppSelector(state => state.hostelers.hostelers);
  const transactions = useAppSelector(state => state.finance.transactions);

  // 1. Switcher options (Only hostels assigned to this owner)
  const assignedHostels = hostels.filter(h => user?.role === 'owner' && h.isActive && user.hostelsAssigned?.includes(h.id));
  const activeHostel = hostels.find(h => h.id === activeHostelId);

  const dropdownItems = assignedHostels.map(h => ({
    label: h.name,
    value: h.id,
  }));

  // 2. Metrics for current hostel
  const hostelRooms = rooms.filter(r => r.hostelId === activeHostelId);
  const activeRoomsCount = hostelRooms.filter(r => r.occupiedCount > 0).length;
  
  const totalBedsCount = hostelRooms.reduce((acc, curr) => acc + curr.capacity, 0);
  const occupiedBedsCount = hostelRooms.reduce((acc, curr) => acc + curr.occupiedCount, 0);
  const vacantBedsCount = totalBedsCount - occupiedBedsCount;

  const activeHostelersCount = hostelers.filter(h => h.hostelId === activeHostelId && h.isActive).length;

  const currentMonthRevenue = transactions
    .filter(tx => tx.hostelId === activeHostelId && tx.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const quickActions = [
    { label: 'Add Hosteler', icon: 'person-add-outline', action: () => navigation.navigate('OwnerHostelers', { screen: 'AddHosteler' }) },
    { label: 'Rooms setup', icon: 'bed-outline', action: () => navigation.navigate('OwnerRooms', { screen: 'RoomList' }) },
    { label: 'Record Finance', icon: 'cash-outline', action: () => navigation.navigate('OwnerFinance', { screen: 'FinanceOverview' }) },
    { label: 'Food Menu', icon: 'restaurant-outline', action: () => navigation.navigate('FoodMenu') },
  ];

  return (
    <View style={styles.container}>
      <Header
        title={activeHostel ? activeHostel.name : 'Owner Dashboard'}
        showDrawer
        onDrawer={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hostel Selector Dropdown (Shown only if owner manages multiple hostels) */}
        {assignedHostels.length > 1 && (
          <View style={styles.switcherBox}>
            <Dropdown
              label="Switch Hostel View"
              placeholder="Select Hostel"
              items={dropdownItems}
              selectedValue={activeHostelId}
              onValueChange={val => hostelService.selectActiveHostel(val)}
            />
          </View>
        )}

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.row}>
            <StatCard
              title="Active Residents"
              value={activeHostelersCount}
              iconName="people-outline"
              trend="1 Vacated today"
              trendType="down"
            />
            <StatCard
              title="Active Rooms"
              value={`${activeRoomsCount}/${hostelRooms.length}`}
              iconName="home-outline"
              trend="Stable occupancy"
              trendType="neutral"
            />
          </View>
          <View style={styles.row}>
            <StatCard
              title="Occupied Beds"
              value={`${occupiedBedsCount}/${totalBedsCount}`}
              iconName="bed-outline"
              trend={`${vacantBedsCount} Vacant`}
              trendType={vacantBedsCount > 0 ? 'up' : 'neutral'}
            />
            <StatCard
              title="Monthly Collections"
              value={`₹${(currentMonthRevenue).toLocaleString()}`}
              iconName="cash-outline"
              trend="+5% this week"
              trendType="up"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operations Shortcuts</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((act, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={act.action}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconBg}>
                  <Ionicons name={act.icon as any} size={22} color={colors.gold} />
                </View>
                <Text style={styles.actionLabel}>{act.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  switcherBox: {
    marginBottom: 8,
  },
  metricsGrid: {
    gap: 16,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  section: {
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(199, 150, 42, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
});
