import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppSelector } from '../../redux/store';
import { RoomStackParamList } from '../../navigation/OwnerNavigator';
import Header from '../../components/Header';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, typography, radius } from '../../theme';

type Props = NativeStackScreenProps<RoomStackParamList, 'RoomDetails'>;

export default function RoomDetailsScreen({ route, navigation }: Props) {
  const { roomId } = route.params;
  const rooms = useAppSelector(state => state.rooms.rooms);
  const hostelers = useAppSelector(state => state.hostelers.hostelers);

  const room = rooms.find(r => r.id === roomId);

  if (!room) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Room record not found</Text>
      </View>
    );
  }

  // Find active occupants allocated to this room
  const occupants = hostelers.filter(h => h.roomId === roomId && h.isActive);
  const isFull = room.occupiedCount >= room.capacity;

  return (
    <View style={styles.container}>
      <Header
        title={`Room ${room.roomNumber}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Room Configuration</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Room Number</Text>
              <Text style={styles.infoVal}>{room.roomNumber}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Floor Location</Text>
              <Text style={styles.infoVal}>Floor {room.floorNumber}</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Room Type</Text>
              <Text style={styles.infoVal}>{room.roomType.toUpperCase()}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Monthly Rent</Text>
              <Text style={styles.infoVal}>₹{room.monthlyRent.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Total Capacity</Text>
              <Text style={styles.infoVal}>{room.capacity} Beds</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Occupancy Status</Text>
              <Text style={[styles.infoVal, { color: isFull ? colors.warmAttention : colors.goldLight }]}>
                {room.occupiedCount} / {room.capacity} Beds Allocated
              </Text>
            </View>
          </View>
        </View>

        {/* Occupants Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Bed Occupants</Text>
          {occupants.length > 0 ? (
            occupants.map((occupant, idx) => (
              <TouchableOpacity
                key={occupant.id}
                style={styles.occupantItem}
                onPress={() => navigation.navigate('OwnerHostelers' as any, { screen: 'HostelerDetails', params: { hostelerId: occupant.id } })}
                activeOpacity={0.8}
              >
                <View style={styles.occupantLeft}>
                  <View style={styles.bedBadge}>
                    <Ionicons name="bed-outline" size={16} color={colors.gold} />
                    <Text style={styles.bedNumber}>Bed {idx + 1}</Text>
                  </View>
                  <View>
                    <Text style={styles.occupantName}>{occupant.name}</Text>
                    <Text style={styles.occupantPhone}>{occupant.phone}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward-outline" size={18} color={colors.gold} />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noOccupantsText}>No occupants currently sharing this room.</Text>
          )}
        </View>

        {/* Allocate Bed Action */}
        {!isFull ? (
          <PrimaryButton
            title="Allocate Bed"
            onPress={() => navigation.navigate('AllocateRoom', { roomId: room.id })}
            style={styles.allocateBtn}
          />
        ) : (
          <View style={styles.fullBanner}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.warmAttention} />
            <Text style={styles.fullBannerText}>Room is at full bed allocation capacity</Text>
          </View>
        )}
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
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
    marginBottom: 4,
  },
  infoVal: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  occupantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  occupantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(199, 150, 42, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
    gap: 4,
  },
  bedNumber: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: 'bold',
  },
  occupantName: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  occupantPhone: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  noOccupantsText: {
    color: colors.textFaint,
    fontSize: typography.sizes.sm,
  },
  allocateBtn: {
    marginTop: 8,
  },
  fullBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(176, 101, 83, 0.08)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(176, 101, 83, 0.25)',
    paddingVertical: 14,
    gap: 8,
    marginTop: 8,
  },
  fullBannerText: {
    color: colors.warmAttention,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
