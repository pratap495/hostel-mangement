import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Hostel } from '../../types';
import { useAppDispatch } from '../../redux/store';
import { setActiveHostel, logout } from '../../redux/slices/authSlice';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import { colors, typography, radius } from '../../theme';

const { width } = Dimensions.get('window');

interface HostelSelectionScreenProps {
  hostels: Hostel[];
}

export default function HostelSelectionScreen({ hostels }: HostelSelectionScreenProps) {
  const dispatch = useAppDispatch();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedId) {
      dispatch(setActiveHostel(selectedId));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Hostel</Text>
          <Text style={styles.subtitle}>Choose which hostel dashboard you want to manage today</Text>
        </View>

        {/* Card Grid */}
        <View style={styles.grid}>
          {hostels.map(hostel => {
            const isSelected = selectedId === hostel.id;
            return (
              <TouchableOpacity
                key={hostel.id}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                ]}
                onPress={() => setSelectedId(hostel.id)}
                activeOpacity={0.85}
              >
                {/* Checkmark Badge */}
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={12} color={colors.background} />
                  </View>
                )}
                
                {/* Icon */}
                <View style={[styles.iconWrapper, isSelected && styles.iconWrapperSelected]}>
                  <Ionicons
                    name="business-outline"
                    size={36}
                    color={isSelected ? colors.gold : colors.textFaint}
                  />
                </View>
                
                {/* Text details */}
                <Text style={styles.hostelName} numberOfLines={1}>
                  {hostel.name}
                </Text>
                <Text style={styles.hostelCity} numberOfLines={1}>
                  {hostel.address}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            disabled={!selectedId}
            style={styles.continueBtn}
          />
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => dispatch(logout())}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.extraBold,
    color: colors.white,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 450,
    marginBottom: 40,
  },
  card: {
    position: 'relative',
    width: (width - 64 - 16) / 2 > 180 ? 180 : (width - 64 - 16) / 2,
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.divider,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSelected: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(208, 122, 59, 0.05)',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconWrapperSelected: {
    backgroundColor: colors.goldTransparent,
  },
  hostelName: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    color: colors.white,
    textAlign: 'center',
    width: '100%',
  },
  hostelCity: {
    fontSize: typography.sizes.xs,
    color: colors.textFaint,
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  footer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  continueBtn: {
    width: '100%',
    marginBottom: 20,
  },
  logoutBtn: {
    paddingVertical: 10,
  },
  logoutText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gold,
  },
});
