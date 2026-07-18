import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppSelector } from '../../redux/store';
import { FinanceStackParamList } from '../../navigation/OwnerNavigator';
import Header from '../../components/Header';
import FinanceCard from '../../components/FinanceCard';
import { colors, typography, radius } from '../../theme';

type Props = NativeStackScreenProps<FinanceStackParamList, 'FinanceOverview'>;

export default function FinanceScreen({ navigation }: Props) {
  const { activeHostelId } = useAppSelector(state => state.auth);
  const transactions = useAppSelector(state => state.finance.transactions);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'expense'>('overview');

  // Filter transactions for current active hostel
  const hostelTx = transactions.filter(tx => tx.hostelId === activeHostelId);
  const incomeTx = hostelTx.filter(tx => tx.type === 'income');
  const expenseTx = hostelTx.filter(tx => tx.type === 'expense');

  // Calculate values
  const totalIncome = incomeTx.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenseTx.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const currentDisplayList = 
    activeTab === 'overview' ? hostelTx : 
    activeTab === 'income' ? incomeTx : expenseTx;

  return (
    <View style={styles.container}>
      <Header
        title="Finance Ledger"
        showDrawer
        onDrawer={() => (navigation as any).getParent()?.openDrawer()}
      />

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryLabel}>Net Profit/Loss</Text>
          <Text style={[styles.summaryVal, { color: netProfit >= 0 ? colors.gold : colors.warmAttention }]}>
            ₹{netProfit.toLocaleString()}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCol}>
            <Text style={styles.colLabel}>Total Income</Text>
            <Text style={[styles.colVal, { color: colors.goldLight }]}>₹{totalIncome.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryCol, styles.borderLeft]}>
            <Text style={styles.colLabel}>Total Expenses</Text>
            <Text style={[styles.colVal, { color: colors.warmAttention }]}>₹{totalExpense.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Selector Tabs */}
      <View style={styles.tabBar}>
        {(['overview', 'income', 'expense'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={currentDisplayList}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <FinanceCard transaction={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cash-outline" size={48} color={colors.textFaint} />
            <Text style={styles.emptyText}>No Transactions Yet</Text>
            <Text style={styles.emptySubtext}>Record rent income or utility expenses below.</Text>
          </View>
        }
      />

      {/* Action Buttons */}
      <View style={styles.footerActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.incomeBtn]}
          onPress={() => navigation.navigate('AddTransaction', { type: 'income' })}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.white} />
          <Text style={styles.actionBtnText}>Record Income</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.expenseBtn]}
          onPress={() => navigation.navigate('AddTransaction', { type: 'expense' })}
          activeOpacity={0.85}
        >
          <Ionicons name="remove-circle-outline" size={20} color={colors.gold} />
          <Text style={[styles.actionBtnText, { color: colors.gold }]}>Record Expense</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summaryContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  summaryHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  summaryLabel: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
  },
  summaryVal: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginTop: 6,
  },
  summaryRow: {
    flexDirection: 'row',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  borderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: colors.divider,
  },
  colLabel: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
    marginBottom: 4,
  },
  colVal: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 14,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    marginHorizontal: 16,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.md - 2,
  },
  tabActive: {
    backgroundColor: colors.gold,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.semibold,
  },
  tabTextActive: {
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // extra spacing for overlay button
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
  footerActions: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  incomeBtn: {
    backgroundColor: colors.gold,
  },
  expenseBtn: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  actionBtnText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});
