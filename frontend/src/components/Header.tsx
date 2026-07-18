import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../theme';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  showDrawer?: boolean;
  onDrawer?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightBadgeCount?: number;
  rightAvatarUrl?: string;
  onAvatarPress?: () => void;
  alignLeft?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBack,
  showDrawer = false,
  onDrawer,
  rightIcon,
  onRightPress,
  rightBadgeCount = 0,
  rightAvatarUrl,
  onAvatarPress,
  alignLeft = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Left Action */}
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.actionBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
          )}
          {showDrawer && !showBack && (
            <TouchableOpacity onPress={onDrawer} style={styles.actionBtn}>
              <Ionicons name="menu-outline" size={26} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center Title */}
        <View style={[styles.titleContainer, alignLeft && styles.titleContainerLeft]}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Right Action */}
        <View style={styles.rightContainer}>
          {rightAvatarUrl ? (
            <TouchableOpacity onPress={onAvatarPress} style={styles.avatarBtn} activeOpacity={0.8}>
              <Image source={{ uri: rightAvatarUrl }} style={styles.avatar} />
            </TouchableOpacity>
          ) : rightIcon ? (
            <TouchableOpacity onPress={onRightPress} style={styles.actionBtn}>
              <Ionicons name={rightIcon} size={24} color={colors.white} />
              {rightBadgeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{rightBadgeCount > 9 ? '9+' : rightBadgeCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftContainer: {
    width: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainerLeft: {
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  title: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  rightContainer: {
    width: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarBtn: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.gold,
    overflow: 'hidden',
  },
  avatar: {
    width: 32,
    height: 32,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: 'bold',
  },
});

export default Header;
