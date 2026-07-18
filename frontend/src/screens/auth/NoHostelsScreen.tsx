import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '../../redux/store';
import { logout } from '../../redux/slices/authSlice';
import SecondaryButton from '../../components/SecondaryButton';
import { colors, typography, radius } from '../../theme';

export default function NoHostelsScreen() {
  const dispatch = useAppDispatch();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <View style={styles.logoBadge}>
          <Ionicons name="alert-circle-outline" size={32} color={colors.gold} />
        </View>
        <Text style={styles.title}>No Hostels Assigned</Text>
        <Text style={styles.subtitle}>
          Your account is not linked to any active hostels yet. Please contact your system administrator to assign a hostel to your profile.
        </Text>
        <SecondaryButton
          title="Log Out"
          onPress={() => dispatch(logout())}
          style={styles.logoutBtn}
          textStyle={styles.logoutText}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 32,
    alignItems: 'center',
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.goldTransparent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    marginBottom: 20,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  logoutBtn: {
    width: '100%',
    borderColor: colors.gold,
    borderWidth: 1,
    height: 48,
  },
  logoutText: {
    color: colors.gold,
    fontWeight: typography.weights.bold,
  },
});
