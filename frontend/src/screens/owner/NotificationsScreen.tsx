import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { markAsRead, markAllAsRead } from '../../redux/slices/notificationsSlice';
import Header from '../../components/Header';
import NotificationCard from '../../components/NotificationCard';
import { colors, typography, radius } from '../../theme';
import { DrawerActions } from '@react-navigation/native';
export default function NotificationsScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { activeHostelId } = useAppSelector(state => state.auth);
  const notifications = useAppSelector(state => state.notifications.notifications);
  
  // Filter notifications for active hostel (and global null-hostel ones)
  const hostelNotifs = notifications.filter(n => !n.hostelId || n.hostelId === activeHostelId);
  const unreadCount = hostelNotifs.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead(activeHostelId || undefined));
  };

  return (
    <View style={styles.container}>
      <Header
        title="Notifications"
        showDrawer
        onDrawer={() => (navigation as any).openDrawer()}
      />

      <View style={styles.actionHeader}>
        <Text style={styles.countText}>
          {unreadCount > 0 ? `${unreadCount} Unread Alerts` : 'All caught up!'}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7} style={styles.markAllBtn}>
            <Ionicons name="checkmark-done" size={16} color={colors.gold} />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={hostelNotifs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onPress={() => dispatch(markAsRead(item.id))}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textFaint} />
            <Text style={styles.emptyText}>No Alerts Found</Text>
            <Text style={styles.emptySubtext}>You will see important notifications here.</Text>
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
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  countText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  markAllText: {
    color: colors.gold,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
