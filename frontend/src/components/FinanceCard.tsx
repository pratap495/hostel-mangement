import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../types';
import { colors, typography, radius } from '../theme';

interface FinanceCardProps {
  transaction: Transaction;
}

export const FinanceCard: React.FC<FinanceCardProps> = ({ transaction }) => {
  const isIncome = transaction.type === 'income';

  return (
    <View style={styles.card}>
      <View style={styles.leftSection}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: isIncome ? 'rgba(208, 122, 59, 0.15)' : 'rgba(176, 101, 83, 0.15)' },
          ]}
        >
          <Ionicons
            name={isIncome ? 'arrow-down-outline' : 'arrow-up-outline'}
            size={20}
            color={isIncome ? colors.goldLight : colors.warmAttention}
          />
        </View>
        <View style={styles.details}>
          <Text style={styles.category}>{transaction.category}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {isIncome
              ? `Rent from ${transaction.hostelerName || 'Resident'}`
              : transaction.description || 'Hostel Expense'}
          </Text>
          <Text style={styles.date}>{transaction.date}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text
          style={[
            styles.amount,
            { color: isIncome ? colors.goldLight : colors.warmAttention },
          ]}
        >
          {isIncome ? '+' : '-'} ₹{transaction.amount.toLocaleString()}
        </Text>
        {transaction.paymentMode && (
          <View style={styles.paymentBadge}>
            <Text style={styles.paymentText}>{transaction.paymentMode.replace('_', ' ').toUpperCase()}</Text>
          </View>
        )}
      </View>
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
      },
    }),
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  category: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  date: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs - 1,
    marginTop: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  paymentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    marginTop: 6,
  },
  paymentText: {
    color: colors.textFaint,
    fontSize: 9,
    fontWeight: 'bold',
  },
});

export default FinanceCard;
