import store from '../redux/store';
import { addTransaction, setTransactions } from '../redux/slices/financeSlice';
import { payHostelerRent } from '../redux/slices/hostelersSlice';
import { addLog } from '../redux/slices/logsSlice';
import { Transaction } from '../types';
import apiClient from './apiClient';
import { storageService } from './storageService';

export const financeService = {
  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const response = await apiClient.get('/finance/transactions');
      const transactions: Transaction[] = response.data.map((t: any) => ({
        id: t.id,
        hostelId: t.hostel_id,
        type: t.type,
        category: t.category,
        amount: Number(t.amount),
        date: t.date,
        paymentMode: t.payment_mode || undefined,
        hostelerId: t.hosteler_id || undefined,
        hostelerName: t.hosteler_name || undefined,
        description: t.description || undefined,
        receiptUrl: t.receipt_url || undefined
      }));
      store.dispatch(setTransactions(transactions));
      return transactions;
    } catch (error: any) {
      console.error('Failed to get transactions:', error);
      return store.getState().finance.transactions;
    }
  },

  recordTransaction: async (tx: Omit<Transaction, 'id'>): Promise<void> => {
    try {
      let createdId = `tx-${Date.now()}`;
      
      if (tx.type === 'income') {
        const response = await apiClient.post('/finance/income', {
          hosteler_id: tx.hostelerId,
          amount: tx.amount,
          payment_date: tx.date,
          payment_mode: tx.paymentMode || 'cash',
          reference_number: null
        });
        createdId = response.data.id;
      } else {
        // Map frontend categories to backend enum categories
        let backendCategory = 'repairs';
        const cat = tx.category.toLowerCase();
        if (cat === 'groceries') {
          backendCategory = 'groceries';
        } else if (cat === 'utilities') {
          backendCategory = 'electricity';
        } else if (cat === 'salary') {
          backendCategory = 'staff_salary';
        } else if (cat === 'repairs') {
          backendCategory = 'repairs';
        } else if (cat === 'rent' || cat === 'others') {
          backendCategory = 'maintenance';
        }

        // Upload receipt photo if provided
        let receiptPhotoKey = null;
        let finalReceiptUrl = tx.receiptUrl;
        if (tx.receiptUrl && !tx.receiptUrl.startsWith('http://') && !tx.receiptUrl.startsWith('https://')) {
          finalReceiptUrl = await storageService.uploadImage(tx.receiptUrl);
          if (finalReceiptUrl.includes('/uploads/')) {
            receiptPhotoKey = 'uploads/' + finalReceiptUrl.split('/uploads/')[1].split('?')[0];
          }
        }

        const response = await apiClient.post('/finance/expenses', {
          category: backendCategory,
          amount: tx.amount,
          expense_date: tx.date,
          description: tx.description || '',
          receipt_photo_url: receiptPhotoKey
        });
        createdId = response.data.id;
        tx.receiptUrl = finalReceiptUrl;
      }

      const createdTx: Transaction = {
        ...tx,
        id: createdId
      };

      // 1. Dispatch transaction entry
      store.dispatch(addTransaction(createdTx));
      
      // 2. If it is rent income, reduce/pay off hosteler rent dues in state
      if (tx.type === 'income' && tx.category === 'Rent' && tx.hostelerId) {
        store.dispatch(payHostelerRent({
          hostelerId: tx.hostelerId,
          amountPaid: tx.amount,
        }));
      }
      
      // 3. Log activity
      const owner = store.getState().auth.user;
      const hostel = store.getState().hostels.hostels.find(h => h.id === tx.hostelId);
      const actionMsg = tx.type === 'income'
        ? `Recorded Income: ₹${tx.amount.toLocaleString()} (${tx.category}) ${tx.hostelerName ? `from ${tx.hostelerName}` : ''}`
        : `Recorded Expense: ₹${tx.amount.toLocaleString()} (${tx.category}) - ${tx.description || ''}`;
        
      store.dispatch(addLog({
        userId: owner?.id || 'system',
        userName: owner?.name || 'Owner',
        action: actionMsg,
        hostelName: hostel?.name,
      }));
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to record transaction';
      throw new Error(errMsg);
    }
  }
};
