import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Room } from '../types';
import { colors, typography, radius } from '../theme';

interface RoomCardProps {
  room: Room;
  onPress?: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onPress }) => {
  const occupancyPercentage = room.capacity > 0 ? (room.occupiedCount / room.capacity) * 100 : 0;
  const isFull = room.occupiedCount >= room.capacity;
  const isVacant = room.occupiedCount === 0;

  const getBadgeColor = () => {
    if (isFull) return colors.warmAttention;
    if (isVacant) return colors.textMuted;
    return colors.gold;
  };

  const getOccupancyText = () => {
    if (isFull) return 'Full';
    if (isVacant) return 'Vacant';
    return 'Partial';
  };

  const badgeColor = getBadgeColor();
  const occupancyStatusText = getOccupancyText();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.roomNumber}>Room {room.roomNumber}</Text>
          <Text style={styles.floorText}>Floor {room.floorNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${badgeColor}1a` }]}>
          <Text style={[styles.statusText, { color: badgeColor }]}>{occupancyStatusText}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Room Type:</Text>
          <Text style={styles.detailVal}>{room.roomType.toUpperCase()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Monthly Rent:</Text>
          <Text style={styles.detailVal}>₹{room.monthlyRent.toLocaleString()}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Bed Allocation</Text>
          <Text style={styles.progressVal}>{room.occupiedCount} / {room.capacity} Beds</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${occupancyPercentage}%`, backgroundColor: colors.gold },
            ]}
          />
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  roomNumber: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  floorText: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  details: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  detailVal: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  progressContainer: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
  },
  progressVal: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.divider,
    borderRadius: radius.xs,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.xs,
  },
});

export default RoomCard;
