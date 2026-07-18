import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Transaction } from '../../types';
import { mockTransactions } from '../mockData';

interface FinanceState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: FinanceState = {
  transactions: mockTransactions,
  loading: false,
  error: null,
};

const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {
    addTransaction(state, action: PayloadAction<Omit<Transaction, 'id'>>) {
      const newId = `tx-${state.transactions.length + 1}`;
      state.transactions.push({
        ...action.payload,
        id: newId,
      });
    },
    setTransactions(state, action: PayloadAction<Transaction[]>) {
      state.transactions = action.payload;
    }
  },
});

export const { addTransaction, setTransactions } = financeSlice.actions;
export default financeSlice.reducer;
