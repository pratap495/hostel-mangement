import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Owner } from '../types';
import { useAppSelector } from '../redux/store';
import { colors, typography, radius } from '../theme';
import OwnerAvatar from './OwnerAvatar';

interface OwnerCardProps {
  owner: Owner;
  onPress?: () => void;
  onEditPress?: () => void;
}

export const OwnerCard: React.FC<OwnerCardProps> = ({ owner, onPress, onEditPress }) => {
  const hostels = useAppSelector(state => state.hostels.hostels);
  const assignedHostels = hostels.filter(h => owner.hostelsAssigned.includes(h.id));
  const hostelNamesStr = assignedHostels.map(h => h.name).join(', ') || 'No hostels';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <OwnerAvatar owner={owner} size={44} style={{ marginRight: 12 }} />
        <View style={styles.details}>
          <Text style={styles.name} numberOfLines={1}>{owner.name}</Text>
          <Text style={styles.email} numberOfLines={1}>{owner.email}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            owner.isActive ? styles.statusActive : styles.statusInactive,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              owner.isActive ? styles.statusActiveText : styles.statusInactiveText,
            ]}
          >
            {owner.isActive ? 'Active' : 'Disabled'}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Phone Number</Text>
          <Text style={styles.infoVal}>{owner.phone}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Assigned Hostels</Text>
          <Text style={styles.infoVal} numberOfLines={1}>{hostelNamesStr}</Text>
        </View>
        {onEditPress ? (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={(e) => {
              e.stopPropagation();
              onEditPress();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={14} color={colors.gold} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-forward-outline" size={18} color={colors.gold} style={styles.chevron} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileIndicator: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: 'rgba(199, 150, 42, 0.15)',
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
    marginRight: 8,
  },
  name: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  email: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  statusActive: {
    backgroundColor: 'rgba(46, 125, 50, 0.15)',
  },
  statusInactive: {
    backgroundColor: 'rgba(211, 47, 47, 0.15)',
  },
  statusText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
  },
  statusActiveText: {
    color: '#81C784',
  },
  statusInactiveText: {
    color: '#E57373',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: colors.divider,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs - 1,
    textTransform: 'uppercase',
    fontWeight: typography.weights.semibold,
    marginBottom: 4,
  },
  infoVal: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  chevron: {
    marginLeft: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: 'rgba(199, 150, 42, 0.1)',
  },
  editBtnText: {
    color: colors.gold,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});

export default OwnerCard;
