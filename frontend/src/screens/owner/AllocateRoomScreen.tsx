import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppSelector } from '../../redux/store';
import { RoomStackParamList } from '../../navigation/OwnerNavigator';
import { colors, typography, radius } from '../../theme';
import TextInput from '../../components/TextInput';
import Dropdown from '../../components/Dropdown';
import PrimaryButton from '../../components/PrimaryButton';
import { hostelerService } from '../../services/hostelerService';

type Props = NativeStackScreenProps<RoomStackParamList, 'AllocateRoom'>;

const allocationSchema = yup.object().shape({
  hostelerId: yup.string().required('Please select a resident'),
  roomId: yup.string().required('Please select a room to allocate'),
  effectiveDate: yup.string().required('Effective date is required').matches(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  reason: yup.string().optional(),
});

export default function AllocateRoomScreen({ route, navigation }: Props) {
  const hostelerIdParam = route.params?.hostelerId;
  const roomIdParam = route.params?.roomId;

  const { activeHostelId } = useAppSelector(state => state.auth);
  const hostelers = useAppSelector(state => state.hostelers.hostelers);
  const rooms = useAppSelector(state => state.rooms.rooms);
  const [loading, setLoading] = useState(false);

  // 1. Fetch active residents for this hostel
  const activeResidents = hostelers.filter(h => h.hostelId === activeHostelId && h.isActive);
  const residentDropdownItems = activeResidents.map(h => ({
    label: h.name,
    value: h.id,
  }));

  // 2. Fetch available rooms in this hostel (occupiedCount < capacity)
  const availableRooms = rooms.filter(r => r.hostelId === activeHostelId && (r.occupiedCount < r.capacity || r.id === roomIdParam));
  const roomDropdownItems = availableRooms.map(r => ({
    label: `Room ${r.roomNumber} (${r.roomType.toUpperCase()} - Available: ${r.capacity - r.occupiedCount} beds)`,
    value: r.id,
  }));

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: yupResolver(allocationSchema),
    defaultValues: {
      hostelerId: hostelerIdParam || '',
      roomId: roomIdParam || '',
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: '',
    },
  });

  const selectedHostelerId = watch('hostelerId');

  useEffect(() => {
    // If we have a resident, auto-populate details or filter accordingly
    if (selectedHostelerId) {
      const selectedHosteler = hostelers.find(h => h.id === selectedHostelerId);
      if (selectedHosteler && selectedHosteler.roomId) {
        // Pre-fill reason if they are already in a room (this is a transfer)
        setValue('reason', `Transfer from Room ${rooms.find(r => r.id === selectedHosteler.roomId)?.roomNumber || ''}`);
      }
    }
  }, [selectedHostelerId]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await hostelerService.transferHosteler(data.hostelerId, data.roomId);
      Alert.alert('Success', 'Room allocation/transfer completed successfully.');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Allocation Failed', err.message || 'Unable to allocate room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Back Action */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Allocate / Transfer Room</Text>
            <Text style={styles.subtitle}>
              Move a resident to a room bed slot and update records
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Resident Dropdown */}
            <Controller
              control={control}
              name="hostelerId"
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  label="Select Resident"
                  placeholder="Select a resident"
                  items={residentDropdownItems}
                  selectedValue={value}
                  onValueChange={onChange}
                  error={errors.hostelerId?.message}
                />
              )}
            />

            {/* Target Room Dropdown */}
            <Controller
              control={control}
              name="roomId"
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  label="Select Target Room"
                  placeholder="Select room with vacant bed"
                  items={roomDropdownItems}
                  selectedValue={value}
                  onValueChange={onChange}
                  error={errors.roomId?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="effectiveDate"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Effective Date (YYYY-MM-DD)"
                  placeholder="2026-07-10"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.effectiveDate?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="reason"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Transfer/Allocation Reason (Optional)"
                  placeholder="Room upgrade / Medical request"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.reason?.message}
                />
              )}
            />

            <PrimaryButton
              title="Confirm Allocation"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  header: {
    alignSelf: 'flex-start',
    marginTop: 24,
    marginBottom: 28,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.extraBold,
    color: colors.white,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: 6,
  },
  form: {
    width: '100%',
    maxWidth: 450,
  },
  submitBtn: {
    marginTop: 16,
  },
});
