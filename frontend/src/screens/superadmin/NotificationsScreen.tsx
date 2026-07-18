import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { markLogsAsRead } from '../../redux/slices/logsSlice';
import Header from '../../components/Header';
import { colors, typography, radius } from '../../theme';

export default function NotificationsScreen({ route, navigation }: any) {
  const dispatch = useAppDispatch();
  const logs = useAppSelector(state => state.logs.logs);
  const showBack = route.params?.showBack;

  useEffect(() => {
    // Clear unread badge count when this screen is opened
    dispatch(markLogsAsRead());
  }, [dispatch]);

  const getTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleMarkAllRead = () => {
    dispatch(markLogsAsRead());
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Notifications"
        showBack={showBack}
        onBack={() => navigation.goBack()}
        showDrawer={!showBack}
        onDrawer={() => (navigation as any).openDrawer()}
        rightIcon="checkmark-done"
        onRightPress={handleMarkAllRead}
      />

      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.notificationCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name={
                    item.action.includes('Register') || item.action.includes('Create')
                      ? 'add-circle-outline'
                      : item.action.includes('Logged')
                      ? 'log-in-outline'
                      : 'checkmark-circle-outline'
                  }
                  size={20}
                  color={colors.gold}
                />
              </View>
              <View style={styles.copy}>
                <Text style={styles.actionText}>{item.action}</Text>
                <Text style={styles.userText}>by {item.userName}</Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Ionicons name="time-outline" size={12} color={colors.textFaint} />
              <Text style={styles.timeText}>{getTimeAgo(item.date)}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textFaint} />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>You are all caught up!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  notificationCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(199, 150, 42, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  copy: {
    flex: 1,
  },
  actionText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    lineHeight: 18,
  },
  userText: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    paddingTop: 10,
  },
  timeText: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs - 1,
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
  },
});
