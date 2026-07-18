import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Hostel } from '../types';
import { colors } from '../theme';

export const HostelCard: React.FC<{ hostel: Hostel; onPress?: () => void }> = ({ hostel, onPress }) => {
  return <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.86}>
    <View style={styles.iconBox}><Ionicons name="business-outline" size={20} color={colors.gold} /></View>
    <View style={styles.copy}>
      <Text style={styles.name}>{hostel.name}</Text>
      <Text style={styles.city}>{hostel.address}</Text>
      <Text style={styles.owner}>Owner: {hostel.ownerName}</Text>
      <Text style={styles.rooms}>{hostel.roomsCount} Rooms</Text>
    </View>
    <View style={styles.right}><View style={[styles.badge, hostel.isActive ? styles.active : styles.inactive]}><Text style={[styles.badgeText, { color: hostel.isActive ? '#81C784' : '#E57373' }]}>{hostel.isActive ? 'Active' : 'Inactive'}</Text></View><Ionicons name="chevron-forward-outline" size={20} color={colors.gold} /></View>
  </TouchableOpacity>;
};

const styles = StyleSheet.create({
  card: {
    minHeight: 102,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(199, 150, 42, 0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  copy: { flex: 1, marginLeft: 12, marginRight: 6, minWidth: 0 },
  name: { color: colors.white, fontSize: 17, fontWeight: '800', flexShrink: 1 },
  city: { color: colors.textFaint, fontSize: 13, marginTop: 3 },
  owner: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
  rooms: { color: colors.textFaint, fontSize: 13, marginTop: 2 },
  right: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch', minWidth: 64 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  active: { backgroundColor: 'rgba(46, 125, 50, 0.15)' },
  inactive: { backgroundColor: 'rgba(211, 47, 47, 0.15)' },
  badgeText: { fontSize: 12, fontWeight: '800' },
});
export default HostelCard;
