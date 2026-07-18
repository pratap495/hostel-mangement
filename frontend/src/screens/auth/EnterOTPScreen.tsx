import React, { useState, useRef } from 'react';
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
  TextInput as RNTextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { colors, typography, radius } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<AuthStackParamList, 'EnterOTP'>;

export default function EnterOTPScreen({ route, navigation }: Props) {
  const email = route.params?.email || 'your email';
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  
  const inputRefs = [
    useRef<RNTextInput>(null),
    useRef<RNTextInput>(null),
    useRef<RNTextInput>(null),
    useRef<RNTextInput>(null),
  ];

  const handleOtpChange = (text: string, index: number) => {
    // Only accept numeric digits
    const cleanText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanText;
    setOtp(newOtp);

    // Auto-focus next input if digit is entered
    if (cleanText && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Auto-focus previous input on backspace if current is empty
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 4) {
      Alert.alert('Incomplete Code', 'Please enter all 4 digits of the OTP code.');
      return;
    }

    setLoading(true);
    try {
      // Simulate API verification
      await new Promise(resolve => setTimeout(resolve, 800));
      // Navigate to Set New Password screen (ResetPassword)
      navigation.navigate('ResetPassword', { email });
    } catch (err) {
      Alert.alert('Verification Failed', 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const isEmail = email.includes('@');
    Alert.alert(
      'OTP Resent',
      isEmail
        ? `A new verification code has been dispatched to ${email}.`
        : `A new verification code has been sent to ${email} via SMS.`,
      [{ text: 'OK' }]
    );
  };

  const isComplete = otp.every(digit => digit !== '');

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
              <Ionicons
                name={email.includes('@') ? 'mail-outline' : 'chatbubble-outline'}
                size={28}
                color={colors.gold}
              />
            </View>
            <Text style={styles.title}>Password Reset</Text>
            <Text style={styles.subtitle}>
              We sent a code to <Text style={styles.boldText}>{email}</Text>
            </Text>
          </View>

          {/* Form / OTP Inputs */}
          <View style={styles.form}>
            <View style={styles.otpInputContainer}>
              {otp.map((digit, index) => (
                <RNTextInput
                  key={index}
                  ref={inputRefs[index]}
                  style={[
                    styles.otpBox,
                    digit ? styles.otpBoxFilled : null,
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  placeholderTextColor={colors.textFaint}
                  selectTextOnFocus
                />
              ))}
            </View>

            <PrimaryButton
              title="Continue"
              onPress={handleVerify}
              loading={loading}
              style={styles.submitBtn}
            />

            {/* Resend Option */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                {email.includes('@') ? "Didn't receive the email? " : "Didn't receive the SMS? "}
              </Text>
              <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                <Text style={styles.resendLink}>Click to resend</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Back to Login */}
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
  boldText: {
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
    marginBottom: 28,
  },
  otpBox: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.divider,
    color: colors.white,
    fontSize: 24,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: colors.gold,
  },
  submitBtn: {
    width: '100%',
    marginTop: 8,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  resendText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  resendLink: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gold,
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
