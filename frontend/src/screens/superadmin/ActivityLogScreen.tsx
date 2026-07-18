import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppSelector } from '../../redux/store';
import Header from '../../components/Header';
import TextInput from '../../components/TextInput';
import { colors, typography, radius } from '../../theme';

export default function ActivityLogScreen({ navigation }: any) {
  const logs = useAppSelector(state => state.logs.logs);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filteredLogs = logs.filter(log => {
    return log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      (log.hostelName && log.hostelName.toLowerCase().includes(search.toLowerCase()));
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Activity Audit Log"
        showDrawer
        onDrawer={() => (navigation as any).openDrawer()}
      />

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Filter activity logs..."
          iconName="search-outline"
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.searchField}
        />
      </View>

      <FlatList
        data={filteredLogs}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
        }
        renderItem={({ item }) => (
          <View style={styles.logCard}>
            <View style={styles.logHeader}>
              <View style={styles.iconContainer}>
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
              <View style={styles.details}>
                <Text style={styles.actionText}>{item.action}</Text>
                <Text style={styles.userText}>
                  by <Text style={styles.highlight}>{item.userName}</Text>{' '}
                  {item.hostelName ? `• ${item.hostelName}` : ''}
                </Text>
              </View>
            </View>
            <View style={styles.footer}>
              <Ionicons name="time-outline" size={13} color={colors.textFaint} />
              <Text style={styles.timeText}>
                {new Date(item.date).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="list-circle-outline" size={48} color={colors.textFaint} />
            <Text style={styles.emptyText}>No Logs Found</Text>
            <Text style={styles.emptySubtext}>No system activity matched your search.</Text>
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
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  searchField: {
    marginBottom: 0,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  logCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(199, 150, 42, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
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
  highlight: {
    color: colors.textMuted,
    fontWeight: typography.weights.bold,
  },
  footer: {
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
