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
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { colors, typography, radius } from '../../theme';
import TextInput from '../../components/TextInput';
import PrimaryButton from '../../components/PrimaryButton';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const forgotSchema = yup.object().shape({
  email: yup.string()
    .required('Email address or phone number is required')
    .test('emailOrPhone', 'Enter a valid email address or 10-digit mobile number', (value) => {
      if (!value) return false;
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const phoneRegex = /^[6-9]\d{9}$/;
      return emailRegex.test(value) || phoneRegex.test(value);
    }),
});

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: { email: string }) => {
    setLoading(true);
    try {
      // Simulate API send reset link
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const isEmail = data.email.includes('@');
      const alertTitle = isEmail ? 'Email Sent' : 'SMS Sent';
      const alertMsg = isEmail
        ? `A mock verification code has been dispatched to ${data.email}.`
        : `A mock verification code has been sent to ${data.email} via SMS.`;

      Alert.alert(
        alertTitle,
        alertMsg,
        [
          {
            text: 'Proceed to Reset',
            onPress: () => navigation.navigate('EnterOTP', { email: data.email }),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Unable to process reset request at this time.');
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

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Ionicons name="keypad-outline" size={28} color={colors.gold} />
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your registered email or phone number. We'll send{'\n'}you a link to reset your password.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  iconName="mail-outline"
                  placeholder="Email or Phone"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />

            <PrimaryButton
              title="Send Reset Link"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={styles.submitBtn}
            />
          </View>
          <TouchableOpacity
            style={styles.backToLoginContainer}
            onPress={() => navigation.navigate('LoginForm')}
            activeOpacity={0.7}
          >
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    marginTop: height * 0.02,
    marginBottom: height * 0.03,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.goldTransparent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.goldBorder,
    marginBottom: 16,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.extraBold,
    color: colors.white,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  submitBtn: {
    marginTop: 8,
  },
    backToLoginContainer: {
    marginTop: 'auto',
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
  },

  backToLoginText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
  },
});
