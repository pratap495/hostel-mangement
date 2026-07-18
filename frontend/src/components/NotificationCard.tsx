import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppNotification } from '../types';
import { colors, typography, radius } from '../theme';

interface NotificationCardProps {
  notification: AppNotification;
  onPress?: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
}) => {
  const getIconConfig = () => {
    switch (notification.type) {
      case 'rent_due':
        return { name: 'card-outline' as const, color: colors.error };
      case 'occupancy':
        return { name: 'people-outline' as const, color: colors.warning };
      case 'active_hostelers':
        return { name: 'trending-up-outline' as const, color: colors.success };
      case 'system':
      default:
        return { name: 'settings-outline' as const, color: colors.gold };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        !notification.isRead && styles.cardUnread,
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={iconConfig.name} size={20} color={iconConfig.color} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
          {!notification.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.body}>{notification.body}</Text>
        <Text style={styles.date}>
          {new Date(notification.date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
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
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
      },
    }),
  },
  cardUnread: {
    borderColor: 'rgba(199, 150, 42, 0.4)',
    backgroundColor: 'rgba(199, 150, 42, 0.02)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    marginLeft: 8,
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
    marginBottom: 8,
  },
  date: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs - 1,
  },
});

export default NotificationCard;
