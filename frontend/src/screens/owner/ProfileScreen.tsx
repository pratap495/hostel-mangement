import React, { useState } from 'react';
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
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppSelector, useAppDispatch } from '../../redux/store';
import { logout, updateProfilePhoto } from '../../redux/slices/authSlice';
import { editOwner } from '../../redux/slices/ownersSlice';
import Header from '../../components/Header';
import TextInput from '../../components/TextInput';
import PasswordInput from '../../components/PasswordInput';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import ProfileUploader from '../../components/ProfileUploader';
import { authService } from '../../services/authService';
import { colors, typography, radius } from '../../theme';

const passwordSchema = yup.object().shape({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string().required('New password is required').min(6, 'Password must be at least 6 characters'),
  confirmPassword: yup.string().required('Confirm new password is required').oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

export default function ProfileScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const owners = useAppSelector(state => state.owners.owners);
  
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string>(user?.profilePhoto || '');
  const [photoError, setPhotoError] = useState('');

  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const handlePhotoChange = (uri: string) => {
    setProfilePhoto(uri);
    setPhotoError('');
    dispatch(updateProfilePhoto(uri));
    
    if (user) {
      const cleanEmail = user.email.trim().toLowerCase();
      const owner = owners.find(o => o.email.trim().toLowerCase() === cleanEmail);
      if (owner) {
        dispatch(editOwner({
          ...owner,
          profilePhoto: uri,
        }));
      }
    }
  };

  const onSubmitPassword = async (data: any) => {
    if (!profilePhoto) {
      setPhotoError('Profile photo is required.');
      Alert.alert('Photo Required', 'Please upload a profile photo first.');
      return;
    }
    setLoading(true);
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      Alert.alert('Success', 'Your login password has been updated.');
      reset();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to exit the application?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => authService.logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Settings & Profile"
        showDrawer
        onDrawer={() => (navigation as any).openDrawer()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Avatar and User Detail card */}
          <View style={styles.profileCard}>
            <ProfileUploader value={profilePhoto} onChange={handlePhotoChange} />
            {photoError ? <Text style={styles.photoErrorText}>{photoError}</Text> : null}
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userRole}>Role: Hostel Owner</Text>
            
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Ionicons name="mail-outline" size={16} color={colors.gold} />
              <Text style={styles.detailText}>{user?.email}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={16} color={colors.gold} />
              <Text style={styles.detailText}>+91 {user?.phone || '9876543210'}</Text>
            </View>
          </View>

          {/* Change Password Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Change Login Password</Text>

            <Controller
              control={control}
              name="currentPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <PasswordInput
                  label="Current Password"
                  placeholder="••••••••"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.currentPassword?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <PasswordInput
                  label="New Password"
                  placeholder="••••••••"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.newPassword?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <PasswordInput
                  label="Confirm New Password"
                  placeholder="••••••••"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <PrimaryButton
              title="Update Password"
              onPress={handleSubmit(onSubmitPassword)}
              loading={loading}
              style={styles.submitBtn}
            />
          </View>

          {/* Logout Action */}
          <SecondaryButton
            title="Log Out of System"
            onPress={handleLogout}
            textStyle={{ color: colors.error }}
            style={styles.logoutBtn}
          />
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  userName: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginTop: 4,
  },
  userRole: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    width: '100%',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  detailText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 20,
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
  submitBtn: {
    marginTop: 10,
  },
  logoutBtn: {
    borderColor: colors.error,
  },
  photoErrorText: {
    color: colors.error,
    fontSize: typography.sizes.xs,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});
