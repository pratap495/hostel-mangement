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
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppSelector } from '../../redux/store';
import { HostelStackParamList } from '../../navigation/SuperAdminNavigator';
import { colors, typography, radius } from '../../theme';
import TextInput from '../../components/TextInput';
import PrimaryButton from '../../components/PrimaryButton';
import HostelPhotoUploader from '../../components/HostelPhotoUploader';
import { hostelService } from '../../services/hostelService';
import { storageService } from '../../services/storageService';

type Props = NativeStackScreenProps<HostelStackParamList, 'AddHostel'>;

const hostelSchema = yup.object().shape({
  name: yup.string().required('Hostel name is required'),
  address: yup.string().required('Address is required'),
  contactNumber: yup.string().required('Contact number is required'),
  floorsCount: yup.number().typeError('Floors must be a number').required('Number of floors is required').min(1, 'Minimum 1 floor required'),
  roomsCount: yup.number().typeError('Rooms must be a number').required('Number of rooms is required').min(1, 'Minimum 1 room required'),
  ownerName: yup.string().optional(),
  ownerEmail: yup.string().email('Enter a valid owner email').optional().nullable(),
  ownerPhone: yup.string().optional(),
});

export default function AddHostelScreen({ route, navigation }: Props) {
  const hostelId = route.params?.hostelId;
  const hostels = useAppSelector(state => state.hostels.hostels);
  const owners = useAppSelector(state => state.owners.owners);
  
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState('');

  // Dropdown States
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const isEditMode = !!hostelId;
  const existingHostel = hostels.find(h => h.id === hostelId);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (route.params?.fromDashboard) {
          (navigation as any).navigate('AdminDashboard');
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        subscription.remove();
      };
    }, [route.params, navigation])
  );

  const handleBack = () => {
    if (route.params?.fromDashboard) {
      (navigation as any).navigate('AdminDashboard');
    } else {
      navigation.goBack();
    }
  };

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: yupResolver(hostelSchema),
    defaultValues: {
      name: '',
      address: '',
      contactNumber: '',
      floorsCount: undefined as any,
      roomsCount: undefined as any,
      ownerName: '',
      ownerEmail: '',
      ownerPhone: '',
    },
  });

  const watchOwnerEmail = watch('ownerEmail');
  const watchHostelName = watch('name');
  const newOwnerEmail = (route.params as any)?.newOwnerEmail;

  // Auto-select owner returned from the CreateOwner page redirect
  useEffect(() => {
    if (newOwnerEmail && owners.length > 0) {
      const foundOwner = owners.find(o => o.email.trim().toLowerCase() === newOwnerEmail.trim().toLowerCase());
      if (foundOwner) {
        setSelectedOwnerId(foundOwner.id);
        setValue('ownerName', foundOwner.name);
        setValue('ownerEmail', foundOwner.email);
        setValue('ownerPhone', foundOwner.phone);
        
        // Clear navigation param to prevent repeating trigger
        navigation.setParams({ newOwnerEmail: undefined } as any);
      }
    }
  }, [newOwnerEmail, owners]);

  useEffect(() => {
    if (isEditMode && existingHostel) {
      setValue('name', existingHostel.name);
      setValue('address', existingHostel.address);
      setValue('contactNumber', existingHostel.contactNumber);
      setValue('floorsCount', existingHostel.floorsCount);
      setValue('roomsCount', existingHostel.roomsCount);
      setValue('ownerName', existingHostel.ownerName);
      setValue('ownerEmail', existingHostel.ownerEmail);
      setValue('ownerPhone', existingHostel.ownerPhone);
      setImageUrl(existingHostel.imageUrl);
    }
  }, [isEditMode, existingHostel]);

  // Try to find selected owner in Redux owners list by matching email or ID
  const selectedOwner = owners.find(o => 
    (selectedOwnerId && o.id === selectedOwnerId) || 
    (watchOwnerEmail && o.email.trim().toLowerCase() === watchOwnerEmail.trim().toLowerCase())
  );

  const filteredOwners = owners.filter(owner =>
    owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    owner.phone.includes(searchQuery) ||
    owner.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = async (data: any) => {
    if (!imageUrl) {
      setImageError('A hostel photo is required.');
      return;
    }
    setLoading(true);
    try {
      // 1. Upload local photo to MinIO / S3
      const uploadedUrl = await storageService.uploadImage(imageUrl);

      if (isEditMode && existingHostel) {
        await hostelService.updateHostel({
          ...existingHostel,
          name: data.name,
          address: data.address,
          contactNumber: data.contactNumber,
          floorsCount: data.floorsCount,
          roomsCount: data.roomsCount,
          ownerName: data.ownerName,
          ownerEmail: data.ownerEmail,
          ownerPhone: data.ownerPhone,
          imageUrl: uploadedUrl,
        });
        navigation.replace('HostelDetails', { hostelId: existingHostel.id });
      } else {
        const hostel = await hostelService.createHostel({
          name: data.name,
          address: data.address,
          contactNumber: data.contactNumber,
          floorsCount: data.floorsCount,
          roomsCount: data.roomsCount,
          ownerName: data.ownerName,
          ownerEmail: data.ownerEmail,
          ownerPhone: data.ownerPhone,
          imageUrl: uploadedUrl,
          isActive: true,
        });
        navigation.replace('HostelDetails', { hostelId: hostel.id });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
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
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.gold} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{isEditMode ? 'Edit Hostel' : 'Add Hostel'}</Text>
            <Text style={styles.subtitle}>
              {isEditMode ? 'Update existing hostel details' : 'Register a new hostel to the platform'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <HostelPhotoUploader value={imageUrl} onChange={uri => { setImageUrl(uri); setImageError(''); }} error={imageError} />
            
            {isEditMode ? (
              <TextInput
                label="Hostel Name (Fixed)"
                value={watchHostelName}
                editable={false}
                containerStyle={{ opacity: 0.7 }}
              />
            ) : (
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Hostel Name"
                    placeholder="Enter Hostel Name"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.name?.message}
                  />
                )}
              />
            )}

            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Hostel Address"
                  placeholder="Enter Hostel Address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.address?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="contactNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Contact Phone Number"
                  placeholder="Enter Phone Number"
                  keyboardType="phone-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.contactNumber?.message}
                />
              )}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <Controller
                  control={control}
                  name="floorsCount"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Total Floors"
                      placeholder="Enter Floors"
                      keyboardType="numeric"
                      onBlur={onBlur}
                      onChangeText={val => onChange(val ? parseInt(val, 10) : '')}
                      value={value?.toString() || ''}
                      error={errors.floorsCount?.message?.toString()}
                    />
                  )}
                />
              </View>
              <View style={styles.col}>
                <Controller
                  control={control}
                  name="roomsCount"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Total Rooms"
                      placeholder="Enter Rooms"
                      keyboardType="numeric"
                      onBlur={onBlur}
                      onChangeText={val => onChange(val ? parseInt(val, 10) : '')}
                      value={value?.toString() || ''}
                      error={errors.roomsCount?.message?.toString()}
                    />
                  )}
                />
              </View>
            </View>

            {/* Owner Section (Only in Create Mode) */}
            {!isEditMode && (
              <View style={styles.ownerSection}>
                <Text style={styles.sectionTitle}>Owner Selection</Text>

                {selectedOwner ? (
                  <View style={styles.selectedOwnerCard}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.success} style={styles.checkmarkIcon} />
                    <View style={styles.ownerDetails}>
                      <Text style={styles.ownerNameText}>{selectedOwner.name}</Text>
                      <Text style={styles.ownerInfoText}>{selectedOwner.email}</Text>
                      <Text style={styles.ownerInfoText}>+91 {selectedOwner.phone}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.changeBtn}
                      onPress={() => {
                        setSelectedOwnerId(null);
                        setValue('ownerName', '');
                        setValue('ownerEmail', '');
                        setValue('ownerPhone', '');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.changeBtnText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.ownerSelectionContainer}>
                    <View style={styles.searchRow}>
                      <View style={styles.searchFieldContainer}>
                        <TextInput
                          label="Select Existing Owner"
                          placeholder="Search by name or email..."
                          value={searchQuery}
                          onChangeText={(text) => {
                            setSearchQuery(text);
                            setShowDropdown(true);
                          }}
                          onFocus={() => setShowDropdown(true)}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.addOwnerInlineBtn}
                        onPress={() => (navigation as any).navigate('AdminOwners', { screen: 'CreateOwner', params: { returnTo: 'AddHostel' } })}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add-circle-outline" size={20} color={colors.gold} />
                        <Text style={styles.addOwnerInlineText}>New Owner</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Validation error for owner selection */}
                    {(errors.ownerName || errors.ownerEmail || errors.ownerPhone) && (
                      <Text style={styles.ownerErrorText}>Please select or create an owner *</Text>
                    )}

                    {/* Dropdown overlay/results */}
                    {showDropdown && searchQuery.length > 0 && (
                      <View style={styles.dropdown}>
                        {filteredOwners.slice(0, 5).map(owner => (
                          <TouchableOpacity
                            key={owner.id}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setSelectedOwnerId(owner.id);
                              setValue('ownerName', owner.name);
                              setValue('ownerEmail', owner.email);
                              setValue('ownerPhone', owner.phone);
                              setSearchQuery('');
                              setShowDropdown(false);
                            }}
                          >
                            <View style={styles.dropdownDetails}>
                              <Text style={styles.dropdownName}>{owner.name}</Text>
                              <Text style={styles.dropdownInfo}>{owner.email} • {owner.phone}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                        {filteredOwners.length === 0 && (
                          <View style={styles.dropdownEmpty}>
                            <Text style={styles.dropdownEmptyText}>No matching owners found</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            <PrimaryButton
              title={isEditMode ? 'Save Changes' : 'Create Hostel'}
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
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  col: {
    flex: 1,
  },
  submitBtn: {
    marginTop: 24,
  },
  sectionTitle: { 
    color: colors.gold, 
    fontSize: typography.sizes.sm, 
    fontWeight: typography.weights.bold, 
    marginTop: 20, 
    marginBottom: 14, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  ownerSection: {
    width: '100%',
    marginTop: 10,
  },
  ownerSelectionContainer: {
    position: 'relative',
    zIndex: 100,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchFieldContainer: {
    flex: 1,
  },
  addOwnerInlineBtn: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(199, 150, 42, 0.1)',
    borderWidth: 1,
    borderColor: colors.goldBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginTop: 6,
    gap: 6,
  },
  addOwnerInlineText: {
    color: colors.gold,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  dropdown: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    maxHeight: 200,
    overflow: 'hidden',
    zIndex: 999,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dropdownDetails: {
    gap: 3,
  },
  dropdownName: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  dropdownInfo: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
  },
  dropdownEmpty: {
    padding: 16,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    color: colors.textFaint,
    fontSize: typography.sizes.sm,
  },
  ownerErrorText: {
    color: colors.error,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginTop: 4,
  },
  selectedOwnerCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  checkmarkIcon: {
    alignSelf: 'center',
  },
  ownerDetails: {
    flex: 1,
    gap: 3,
  },
  ownerNameText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  ownerInfoText: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
  },
  changeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  changeBtnText: {
    color: colors.gold,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});
