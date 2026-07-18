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
import * as ImagePicker from 'expo-image-picker';

import { useAppSelector } from '../../redux/store';
import { OwnerStackParamList } from '../../navigation/SuperAdminNavigator';
import { colors, typography, radius } from '../../theme';
import TextInput from '../../components/TextInput';
import PasswordInput from '../../components/PasswordInput';
import PrimaryButton from '../../components/PrimaryButton';
import OwnerAvatar from '../../components/OwnerAvatar';
import { ownerService } from '../../services/ownerService';

type Props = NativeStackScreenProps<OwnerStackParamList, 'CreateOwner'>;

const ownerSchema = yup.object().shape({
  name: yup.string().required('Full name is required'),
  email: yup.string().required('Email is required').email('Enter a valid email address'),
  phone: yup.string().required('Phone number is required').matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  password: yup.string().required('Password is required').min(8, 'Password must be at least 8 characters'),
});

export default function CreateOwnerScreen({ route, navigation }: Props) {
  const ownerId = route.params?.ownerId;
  const owners = useAppSelector(state => state.owners.owners);
  const hostels = useAppSelector(state => state.hostels.hostels);
  const [loading, setLoading] = useState(false);
  const [selectedHostels, setSelectedHostels] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const isEditMode = !!ownerId;
  const existingOwner = owners.find(o => o.id === ownerId);

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
    resolver: yupResolver(ownerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const watchName = watch('name');

  useEffect(() => {
    if (isEditMode && existingOwner) {
      setValue('name', existingOwner.name);
      setValue('email', existingOwner.email);
      setValue('phone', existingOwner.phone);
      setValue('password', '••••••••'); // Masked for edit mode
      setSelectedHostels(existingOwner.hostelsAssigned);
      setPhotoUrl(existingOwner.photoUrl || null);
    }
  }, [isEditMode, existingOwner]);

  const handlePickPhoto = async () => {
    const options: any[] = [
      { text: 'Choose from Library', onPress: () => { performPickPhoto(); } },
    ];
    if (photoUrl) {
      options.push({ text: 'Remove Photo', onPress: () => setPhotoUrl(null), style: 'destructive' as const });
    }
    options.push({ text: 'Cancel', onPress: () => {}, style: 'cancel' as const });

    Alert.alert(
      'Profile Photo',
      'Upload profile photo',
      options as any
    );
  };

  const performPickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Library access permission is required to upload photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        setPhotoUrl(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Unable to choose photo.');
    }
  };

  const handleToggleHostel = (id: string) => {
    setSelectedHostels(prev =>
      prev.includes(id) ? prev.filter(hid => hid !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (isEditMode && existingOwner) {
        await ownerService.updateOwner({
          ...existingOwner,
          name: data.name,
          email: data.email,
          phone: data.phone,
          hostelsAssigned: selectedHostels,
          photoUrl: photoUrl,
        });
        Alert.alert('Success', 'Owner profile updated successfully.');
      } else {
        await ownerService.createOwner({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          hostelsAssigned: selectedHostels,
          isActive: true,
          photoUrl: photoUrl,
        });
        Alert.alert('Success', 'New Owner account created successfully.');
      }
      if (route.params?.returnTo === 'AddHostel') {
        (navigation as any).navigate('AdminHostels', {
          screen: 'AddHostel',
          params: { newOwnerEmail: data.email },
        });
      } else if (route.params?.returnTo === 'HostelDetails') {
        (navigation as any).navigate('AdminHostels', {
          screen: 'HostelDetails',
          params: { hostelId: route.params.hostelId, newOwnerEmail: data.email },
        });
      } else {
        navigation.goBack();
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
            <Text style={styles.title}>{isEditMode ? 'Edit Owner' : 'Create Owner'}</Text>
            <Text style={styles.subtitle}>
              {isEditMode ? 'Update account info and hostel linkage' : 'Register a new hostel owner account'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Avatar Uploader */}
            <View style={styles.avatarUploaderContainer}>
              <TouchableOpacity
                style={styles.avatarUploader}
                onPress={handlePickPhoto}
                activeOpacity={0.8}
              >
                <OwnerAvatar
                  owner={{ name: watchName || '', photoUrl }}
                  size={90}
                />
                <View style={styles.editBadge}>
                  <Ionicons name="camera" size={14} color={colors.white} />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarLabel}>Upload Photo</Text>
            </View>

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Full Name"
                  placeholder="Enter Full Name"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Email Address"
                  placeholder="Enter Email Address"
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
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Phone Number"
                  placeholder="Enter Phone Number"
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
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <PasswordInput
                  label="Login Password"
                  placeholder="Enter Password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />
            <PrimaryButton
              title={isEditMode ? 'Save Changes' : 'Create Account'}
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
  hostelSelectContainer: {
    marginBottom: 20,
  },
  hostelSelectLabel: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  hostelCheckboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  hostelCheckboxItemActive: {
    borderColor: colors.goldBorder,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radius.xs,
    borderWidth: 1.5,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  checkboxText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  checkboxTextActive: {
    color: colors.white,
  },
  submitBtn: {
    marginTop: 16,
  },
  avatarUploaderContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  avatarUploader: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'visible',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginTop: 8,
  },
});
