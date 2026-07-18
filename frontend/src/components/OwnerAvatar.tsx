import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Owner } from '../types';
import { colors, typography, radius } from '../theme';

interface OwnerAvatarProps {
  owner?: Partial<Owner> | null;
  size?: number;
  style?: any;
  textStyle?: TextStyle;
}

export const OwnerAvatar: React.FC<OwnerAvatarProps> = ({
  owner,
  size = 44,
  style,
  textStyle,
}) => {
  const photoUrl = owner?.photoUrl;
  const name = owner?.name || '';

  const getInitials = (n: string) => {
    if (!n) return '';
    const parts = n.trim().split(/\s+/);
    const initials = parts.map(p => p[0]).join('').toUpperCase();
    return initials.substring(0, 2);
  };

  const initials = getInitials(name);

  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style,
        ]}
      />
    );
  }

  // No photo, but a name exists — show initials
  if (initials) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: 'rgba(199, 150, 42, 0.15)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.gold,
          },
          style,
        ]}
      >
        <Text
          style={[
            {
              color: colors.gold,
              fontSize: Math.round(size * 0.38),
              fontWeight: typography.weights.bold,
            },
            textStyle,
          ]}
        >
          {initials}
        </Text>
      </View>
    );
  }

  // Neither photo nor name yet — neutral person icon, not "?"
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.card,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.divider,
        },
        style,
      ]}
    >
      <Ionicons name="person-outline" size={Math.round(size * 0.5)} color={colors.gold} />
    </View>
  );
};

export default OwnerAvatar;