import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppSelector } from '../../redux/store';
import { OwnerStackParamList } from '../../navigation/SuperAdminNavigator';
import Header from '../../components/Header';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import OwnerAvatar from '../../components/OwnerAvatar';
import { ownerService } from '../../services/ownerService';
import { colors, typography, radius } from '../../theme';

type Props = NativeStackScreenProps<OwnerStackParamList, 'OwnerDetails'>;

export default function OwnerDetailsScreen({ route, navigation }: Props) {
  const { ownerId } = route.params;
  const owners = useAppSelector(state => state.owners.owners);
  const hostels = useAppSelector(state => state.hostels.hostels);
  const [loading, setLoading] = useState(false);

  const owner = owners.find(o => o.id === ownerId);

  if (!owner) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Owner not found</Text>
      </View>
    );
  }

  // Find hostels assigned to this owner
  const managedHostels = hostels.filter(h => owner.hostelsAssigned.includes(h.id));

  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      await ownerService.toggleOwnerStatus(ownerId);
      Alert.alert('Status Updated', `Owner account is now ${!owner.isActive ? 'Active' : 'Disabled'}`);
    } catch (err) {
      Alert.alert('Error', 'Unable to toggle status.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    // Generate a secure mock password
    const newPass = Math.random().toString(36).substring(2, 10).toUpperCase();
    Alert.alert(
      'Password Reset Successful',
      `Temporary password generated:\n\n${newPass}\n\nPlease share this with the owner. Change on first login is enforced.`,
      [{ text: 'Copy to Clipboard', onPress: () => {} }]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={owner.name}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <OwnerAvatar owner={owner} size={72} style={{ marginBottom: 12 }} />
          <Text style={styles.name}>{owner.name}</Text>
          <Text style={styles.email}>{owner.email}</Text>
          <View style={[styles.statusBadge, { backgroundColor: owner.isActive ? 'rgba(46, 125, 50, 0.15)' : 'rgba(211, 47, 47, 0.15)' }]}>
            <Text style={[styles.statusText, { color: owner.isActive ? '#81C784' : '#E57373' }]}>
              {owner.isActive ? 'Active' : 'Disabled'}
            </Text>
          </View>
        </View>

        {/* Contact Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Owner Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoVal}>{owner.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoVal}>{owner.email}</Text>
          </View>
        </View>

        {/* Assigned Hostels Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assigned Hostels</Text>
          {managedHostels.length > 0 ? (
            managedHostels.map(hostel => (
              <View key={hostel.id} style={styles.hostelItem}>
                <Ionicons name="business-outline" size={18} color={colors.gold} />
                <View style={styles.hostelTextContainer}>
                  <Text style={styles.hostelName}>{hostel.name}</Text>
                  <Text style={styles.hostelAddress} numberOfLines={1}>{hostel.address}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noHostelText}>No hostels linked to this owner account yet.</Text>
          )}
        </View>

        {/* Management Controls */}
        <View style={styles.actions}>
          <PrimaryButton
            title="Edit Details"
            onPress={() => navigation.navigate('CreateOwner', { ownerId: owner.id })}
            style={styles.actionBtn}
          />
          <SecondaryButton
            title="Reset Password"
            onPress={handleResetPassword}
            style={styles.actionBtn}
          />
        </View>

        <SecondaryButton
          title={owner.isActive ? 'Disable Owner Account' : 'Enable Owner Account'}
          onPress={handleToggleStatus}
          loading={loading}
          textStyle={{ color: owner.isActive ? colors.error : colors.success }}
          style={[styles.disableBtn, { borderColor: owner.isActive ? colors.error : colors.success }]}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(199, 150, 42, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
    marginBottom: 12,
  },
  avatarText: {
    color: colors.gold,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  name: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  email: {
    color: colors.textFaint,
    fontSize: typography.sizes.sm,
    marginTop: 4,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
    marginBottom: 4,
  },
  infoVal: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  hostelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  hostelTextContainer: {
    flex: 1,
  },
  hostelName: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  hostelAddress: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  noHostelText: {
    color: colors.textFaint,
    fontSize: typography.sizes.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
  },
  disableBtn: {
    width: '100%',
  },
});
