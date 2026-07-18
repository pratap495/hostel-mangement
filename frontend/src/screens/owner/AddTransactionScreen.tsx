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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppSelector } from '../../redux/store';
import { FinanceStackParamList } from '../../navigation/OwnerNavigator';
import { colors, typography, radius, images } from '../../theme';
import TextInput from '../../components/TextInput';
import Dropdown from '../../components/Dropdown';
import PrimaryButton from '../../components/PrimaryButton';
import { financeService } from '../../services/financeService';

type Props = NativeStackScreenProps<FinanceStackParamList, 'AddTransaction'>;

const transactionSchema = yup.object().shape({
  category: yup.string().required('Category is required'),
  amount: yup.number().typeError('Amount must be a number').required('Amount is required').min(1, 'Amount must be greater than zero'),
  date: yup.string().required('Date is required').matches(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  paymentMode: yup.string().optional(),
  hostelerId: yup.string().optional(),
  description: yup.string().optional(),
});

export default function AddTransactionScreen({ route, navigation }: Props) {
  const { type } = route.params;
  const isIncome = type === 'income';

  const { activeHostelId } = useAppSelector(state => state.auth);
  const hostelers = useAppSelector(state => state.hostelers.hostelers);
  
  const [loading, setLoading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string>('');

  // 1. Fetch active residents for this hostel
  const activeResidents = hostelers.filter(h => h.hostelId === activeHostelId && h.isActive);
  const residentDropdownItems = activeResidents.map(h => ({
    label: `${h.name} ${h.isRentOverdue ? `(Due: ₹${h.rentAmountDue})` : ''}`,
    value: h.id,
  }));

  // Categories
  const incomeCategories = [{ label: 'Rent Collection', value: 'Rent' }, { label: 'Others', value: 'Others' }];
  const expenseCategories = [
    { label: 'Groceries / Kitchen', value: 'Groceries' },
    { label: 'Electricity / Water Bills', value: 'Utilities' },
    { label: 'Staff Salaries', value: 'Salary' },
    { label: 'Maintenance & Repairs', value: 'Repairs' },
    { label: 'Hostel Rent / Lease', value: 'Rent' },
    { label: 'Others', value: 'Others' },
  ];

  const paymentModes = [
    { label: 'UPI / QR Code', value: 'upi' },
    { label: 'Cash Payment', value: 'cash' },
    { label: 'Direct Bank Transfer', value: 'bank_transfer' },
  ];

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: yupResolver(transactionSchema),
    defaultValues: {
      category: isIncome ? 'Rent' : 'Groceries',
      amount: undefined as any,
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'upi',
      hostelerId: '',
      description: '',
    },
  });

  const selectedHostelerId = watch('hostelerId');
  const selectedCategory = watch('category');

  // Autofill amount if resident is selected and has dues
  useEffect(() => {
    if (isIncome && selectedCategory === 'Rent' && selectedHostelerId) {
      const res = activeResidents.find(r => r.id === selectedHostelerId);
      if (res && res.isRentOverdue && res.rentAmountDue) {
        setValue('amount', res.rentAmountDue);
        setValue('description', `Rent Collection - ${res.name}`);
      }
    }
  }, [selectedHostelerId, selectedCategory]);

  const handleUploadReceipt = () => {
    const mockUri = 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=400&auto=format&fit=crop';
    setReceiptUrl(mockUri);
  };

  const onSubmit = async (data: any) => {
    // For rent income, validate hosteler selection
    if (isIncome && data.category === 'Rent' && !data.hostelerId) {
      Alert.alert('Validation Error', 'Please select the resident paying rent.');
      return;
    }

    setLoading(true);
    try {
      const selectedHosteler = activeResidents.find(r => r.id === data.hostelerId);
      
      await financeService.recordTransaction({
        hostelId: activeHostelId || '',
        type,
        category: data.category,
        amount: data.amount,
        date: data.date,
        paymentMode: isIncome ? (data.paymentMode as any) : undefined,
        hostelerId: isIncome ? data.hostelerId : undefined,
        hostelerName: isIncome && selectedHosteler ? selectedHosteler.name : undefined,
        description: data.description,
        receiptUrl: !isIncome ? receiptUrl : undefined,
      });

      Alert.alert('Success', `${isIncome ? 'Income' : 'Expense'} recorded successfully.`);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Unable to record transaction.');
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
            <Text style={styles.title}>{isIncome ? 'Record Income' : 'Record Expense'}</Text>
            <Text style={styles.subtitle}>
              {isIncome ? 'Log hostel rent collections' : 'Log grocery, staff salaries, or utility expenses'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Category */}
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  label="Category"
                  items={isIncome ? incomeCategories : expenseCategories}
                  selectedValue={value}
                  onValueChange={onChange}
                  error={errors.category?.message}
                />
              )}
            />

            {/* Resident selection (Only for rent income) */}
            {isIncome && selectedCategory === 'Rent' && (
              <Controller
                control={control}
                name="hostelerId"
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    label="Payer Resident"
                    placeholder="Select paying resident"
                    items={residentDropdownItems}
                    selectedValue={value || null}
                    onValueChange={onChange}
                    error={errors.hostelerId?.message}
                  />
                )}
              />
            )}

            {/* Amount */}
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Transaction Amount (₹)"
                  placeholder="6000"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={val => onChange(val ? parseFloat(val) : '')}
                  value={value?.toString() || ''}
                  error={errors.amount?.message ? String(errors.amount.message) : undefined}
                />
              )}
            />

            {/* Date */}
            <Controller
              control={control}
              name="date"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Transaction Date (YYYY-MM-DD)"
                  placeholder="2026-07-10"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.date?.message}
                />
              )}
            />

            {/* Payment Mode (Income only) */}
            {isIncome && (
              <Controller
                control={control}
                name="paymentMode"
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    label="Payment Mode"
                    items={paymentModes}
                    selectedValue={value || null}
                    onValueChange={onChange}
                    error={errors.paymentMode?.message}
                  />
                )}
              />
            )}

            {/* Description */}
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Description / Details"
                  placeholder="Utility electric bill for June / Grocery purchase"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.description?.message}
                />
              )}
            />

            {/* Receipt upload (Expense only) */}
            {!isIncome && (
              <View style={styles.receiptContainer}>
                <Text style={styles.receiptLabel}>Invoice Receipt Upload (Optional)</Text>
                <TouchableOpacity
                  style={[styles.receiptBox, receiptUrl ? styles.receiptBoxSelected : null]}
                  onPress={handleUploadReceipt}
                  activeOpacity={0.8}
                >
                  {receiptUrl ? (
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: receiptUrl }} style={styles.receiptImage} />
                      <TouchableOpacity style={styles.trashBtn} onPress={() => setReceiptUrl('')}>
                        <Ionicons name="trash" size={16} color={colors.white} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.placeholderContainer}>
                      <Ionicons name="camera-outline" size={28} color={colors.gold} />
                      <Text style={styles.placeholderText}>Tap to Scan or Upload Receipt</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <PrimaryButton
              title="Record Ledger"
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
  receiptContainer: {
    marginBottom: 20,
  },
  receiptLabel: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  receiptBox: {
    height: 120,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  receiptBoxSelected: {
    borderStyle: 'solid',
    borderColor: colors.gold,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  trashBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(211, 47, 47, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginTop: 8,
  },
  submitBtn: {
    marginTop: 16,
  },
});
