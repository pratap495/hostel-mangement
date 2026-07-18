import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius } from '../theme';

interface StatCardProps {
  title: string;
  value: string | number;
  iconName: keyof typeof Ionicons.glyphMap;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  iconName,
  trend,
  trendType = 'neutral',
}) => {
  const getTrendColor = () => {
    if (trendType === 'up') return colors.goldLight;
    if (trendType === 'down') return colors.warmAttention;
    return colors.textFaint;
  };

  const getTrendIcon = () => {
    if (trendType === 'up') return 'arrow-up';
    if (trendType === 'down') return 'arrow-down';
    return undefined;
  };

  const trendColor = getTrendColor();
  const trendIcon = getTrendIcon();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={20} color={colors.gold} />
        </View>
      </View>
      
      <Text style={styles.value}>{value}</Text>
      
      {trend && (
        <View style={styles.trendContainer}>
          {trendIcon && (
            <Ionicons
              name={trendIcon}
              size={12}
              color={trendColor}
              style={styles.trendIcon}
            />
          )}
          <Text style={[styles.trendText, { color: trendColor }]}>{trend}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    flex: 1,
    minWidth: 140,
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
    marginBottom: 12,
  },
  title: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(199, 150, 42, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: 6,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    marginRight: 4,
  },
  trendText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
});

export default StatCard;
