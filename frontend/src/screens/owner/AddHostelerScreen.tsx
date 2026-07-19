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
import { HostelerStackParamList } from '../../navigation/OwnerNavigator';
import { colors, typography, radius } from '../../theme';
import TextInput from '../../components/TextInput';
import Dropdown from '../../components/Dropdown';
import ProfileUploader from '../../components/ProfileUploader';
import AadhaarUploader from '../../components/AadhaarUploader';
import PrimaryButton from '../../components/PrimaryButton';
import { hostelerService } from '../../services/hostelerService';

type Props = NativeStackScreenProps<HostelerStackParamList, 'AddHosteler'>;

const hostelerSchema = yup.object().shape({
  name: yup.string().required('Full name is required'),
  phone: yup.string().required('Phone number is required').matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email: yup.string().email('Enter a valid email address').nullable().optional(),
  permanentAddress: yup.string().required('Permanent address is required'),
  emergencyContactName: yup.string().required('Emergency contact name is required'),
  emergencyContactPhone: yup.string().required('Emergency phone is required').matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  joiningDate: yup.string().required('Joining date is required').matches(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  roomId: yup.string().required('Room allocation is required'),
});

export default function AddHostelerScreen({ route, navigation }: Props) {
  const hostelerId = route.params?.hostelerId;
  const { activeHostelId } = useAppSelector(state => state.auth);
  const hostelers = useAppSelector(state => state.hostelers.hostelers);
  const rooms = useAppSelector(state => state.rooms.rooms);
  
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState<string>('');
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState<string>('');

  const isEditMode = !!hostelerId;
  const existingHosteler = hostelers.find(h => h.id === hostelerId);

  // Fetch rooms for this hostel that are NOT full
  const availableRooms = rooms.filter(r => r.hostelId === activeHostelId && (r.occupiedCount < r.capacity || (isEditMode && r.id === existingHosteler?.roomId)));
  
  const roomDropdownItems = availableRooms.map(r => ({
    label: `Room ${r.roomNumber} (${r.roomType.toUpperCase()} - Rent: ₹${r.monthlyRent} - Available: ${r.capacity - r.occupiedCount} beds)`,
    value: r.id,
  }));

  const { control, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: yupResolver(hostelerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      permanentAddress: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      joiningDate: new Date().toISOString().split('T')[0],
      roomId: '',
    },
  });

  useEffect(() => {
    if (isEditMode && existingHosteler) {
      setValue('name', existingHosteler.name);
      setValue('phone', existingHosteler.phone);
      setValue('email', existingHosteler.email);
      setValue('permanentAddress', existingHosteler.permanentAddress);
      setValue('emergencyContactName', existingHosteler.emergencyContactName);
      setValue('emergencyContactPhone', existingHosteler.emergencyContactPhone);
      setValue('joiningDate', existingHosteler.joiningDate);
      setValue('roomId', existingHosteler.roomId);
      setPhotoUrl(existingHosteler.photoUrl || '');
      setAadhaarFrontUrl(existingHosteler.aadhaarFrontUrl || '');
      setAadhaarBackUrl(existingHosteler.aadhaarBackUrl || '');
    }
  }, [isEditMode, existingHosteler]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (isEditMode && existingHosteler) {
        await hostelerService.updateHosteler({
          ...existingHosteler,
          name: data.name,
          phone: data.phone,
          email: data.email,
          permanentAddress: data.permanentAddress,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          joiningDate: data.joiningDate,
          roomId: data.roomId,
          photoUrl,
          aadhaarFrontUrl,
          aadhaarBackUrl,
        });
        Alert.alert('Success', 'Resident details updated successfully.');
      } else {
        await hostelerService.createHosteler({
          hostelId: activeHostelId || '',
          name: data.name,
          phone: data.phone,
          email: data.email,
          permanentAddress: data.permanentAddress,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          joiningDate: data.joiningDate,
          roomId: data.roomId,
          photoUrl,
          aadhaarFrontUrl,
          aadhaarBackUrl,
          isActive: true,
          isRentOverdue: false,
        });
        Alert.alert('Success', 'Resident registered and bed allocated successfully.');
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = (errors: any) => {
    console.log("FORM VALIDATION ERRORS:", errors);
    Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
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
            <Text style={styles.title}>{isEditMode ? 'Edit Profile' : 'New Resident'}</Text>
            <Text style={styles.subtitle}>
              {isEditMode ? 'Update resident information' : 'Register a hosteler and allocate an available bed'}
            </Text>
          </View>

          {/* Photo Uploader */}
          <ProfileUploader value={photoUrl} onChange={setPhotoUrl} />

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Full Name"
                  placeholder="Rahul Sharma"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Mobile Number"
                  placeholder="9876543210"
                  keyboardType="phone-pad"
                  maxLength={10}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.phone?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Email Address"
                  placeholder="rahul.sharma@gmail.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="permanentAddress"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Permanent Address"
                  placeholder="H.No 45, Gandhi Nagar, Patna, Bihar"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.permanentAddress?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="joiningDate"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Date of Joining (YYYY-MM-DD)"
                  placeholder="2026-07-10"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.joiningDate?.message}
                />
              )}
            />

            {/* Room Selector */}
            <Controller
              control={control}
              name="roomId"
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  label="Allocate Room"
                  placeholder="Select available room"
                  items={roomDropdownItems}
                  selectedValue={value}
                  onValueChange={onChange}
                  error={errors.roomId?.message}
                />
              )}
            />

            {/* Emergency Info */}
            <Text style={styles.sectionHeader}>Emergency Contact</Text>

            <Controller
              control={control}
              name="emergencyContactName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Contact Person Name"
                  placeholder="M.P. Sharma (Father)"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.emergencyContactName?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="emergencyContactPhone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Emergency Mobile Number"
                  placeholder="9876543211"
                  keyboardType="phone-pad"
                  maxLength={10}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.emergencyContactPhone?.message}
                />
              )}
            />

            {/* Aadhaar Verification */}
            <Text style={styles.sectionHeader}>Identity Verification (Aadhaar)</Text>

            <AadhaarUploader
              label="Aadhaar Card Front Side"
              value={aadhaarFrontUrl}
              onChange={setAadhaarFrontUrl}
            />

            <AadhaarUploader
              label="Aadhaar Card Back Side"
              value={aadhaarBackUrl}
              onChange={setAadhaarBackUrl}
            />

            <PrimaryButton
              title={isEditMode ? 'Save Changes' : 'Register Resident'}
              onPress={handleSubmit(onSubmit, onInvalid)}
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
    marginBottom: 24,
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
  sectionHeader: {
    color: colors.gold,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginTop: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 6,
  },
  submitBtn: {
    marginTop: 24,
  },
});
