import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppSelector } from '../../redux/store';
import { HostelerStackParamList } from '../../navigation/OwnerNavigator';
import Header from '../../components/Header';
import TextInput from '../../components/TextInput';
import { colors, typography, radius } from '../../theme';

type Props = NativeStackScreenProps<HostelerStackParamList, 'HostelerList'>;

export default function HostelerListScreen({ navigation }: Props) {
  const { activeHostelId } = useAppSelector(state => state.auth);
  const hostelers = useAppSelector(state => state.hostelers.hostelers);
  const rooms = useAppSelector(state => state.rooms.rooms);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'rent_due'>('all');

  // Filter hostelers for current active hostel
  const activeHostelers = hostelers.filter(h => h.hostelId === activeHostelId);
  const hostelRooms = rooms.filter(r => r.hostelId === activeHostelId);

  const filteredHostelers = activeHostelers.filter(hosteler => {
    const matchesSearch = hosteler.name.toLowerCase().includes(search.toLowerCase()) ||
      hosteler.phone.includes(search) ||
      hosteler.email.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && hosteler.isActive) ||
      (filter === 'inactive' && !hosteler.isActive) ||
      (filter === 'rent_due' && hosteler.isActive && hosteler.isRentOverdue);

    return matchesSearch && matchesFilter;
  });

  const getRoomNumber = (roomId: string) => {
    const r = hostelRooms.find(rm => rm.id === roomId);
    return r ? `Room ${r.roomNumber}` : 'Unassigned';
  };

  return (
    <View style={styles.container}>
      <Header
        title="Resident Profiles"
        showDrawer
        onDrawer={() => (navigation as any).getParent()?.openDrawer()}
      />

      <View style={styles.searchBarContainer}>
        <TextInput
          placeholder="Search residents..."
          iconName="search-outline"
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.searchField}
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddHosteler')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {(['all', 'active', 'inactive', 'rent_due'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filter === tab && styles.filterTextActive]}>
              {tab.replace('_', ' ').toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Residents List */}
      <FlatList
        data={filteredHostelers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.hostelerCard}
            onPress={() => navigation.navigate('HostelerDetails', { hostelerId: item.id })}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </Text>
              </View>
              <View style={styles.details}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.roomText}>{getRoomNumber(item.roomId)}</Text>
              </View>

              <View style={styles.badgeRow}>
                {item.isActive ? (
                  item.isRentOverdue ? (
                    <View style={[styles.badge, styles.badgeDue]}>
                      <Text style={[styles.badgeText, styles.badgeTextDue]}>
                        Due: ₹{item.rentAmountDue}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.badge, styles.badgeActive]}>
                      <Text style={[styles.badgeText, styles.badgeTextActive]}>Active</Text>
                    </View>
                  )
                ) : (
                  <View style={[styles.badge, styles.badgeInactive]}>
                    <Text style={[styles.badgeText, styles.badgeTextInactive]}>Vacated</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={16} color={colors.gold} />
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textFaint} />
            <Text style={styles.emptyText}>No Residents Found</Text>
            <Text style={styles.emptySubtext}>Try another filter or search term.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginVertical: 14,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    marginHorizontal: 16,
    padding: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.md - 2,
  },
  filterTabActive: {
    backgroundColor: colors.gold,
  },
  filterText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: typography.weights.semibold,
  },
  filterTextActive: {
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  hostelerCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(199, 150, 42, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  avatarText: {
    color: colors.gold,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  details: {
    flex: 1,
  },
  name: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  roomText: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
    marginTop: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  badgeActive: {
    backgroundColor: 'rgba(46, 125, 50, 0.15)',
  },
  badgeInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  badgeDue: {
    backgroundColor: 'rgba(211, 47, 47, 0.15)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeTextActive: {
    color: '#81C784',
  },
  badgeTextInactive: {
    color: colors.textFaint,
  },
  badgeTextDue: {
    color: '#E57373',
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
});
