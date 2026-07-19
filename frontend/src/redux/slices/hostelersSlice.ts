import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Hosteler } from '../../types';
import { mockHostelers } from '../mockData';

interface HostelersState {
  hostelers: Hosteler[];
  loading: boolean;
  error: string | null;
}

const initialState: HostelersState = {
  hostelers: [],
  loading: false,
  error: null,
};

const hostelersSlice = createSlice({
  name: 'hostelers',
  initialState,
  reducers: {
    addHosteler(state, action: PayloadAction<Omit<Hosteler, 'id'>>) {
      const newId = `hosteler-${state.hostelers.length + 1}`;
      state.hostelers.push({
        ...action.payload,
        id: newId,
      });
    },
    editHosteler(state, action: PayloadAction<Hosteler>) {
      const index = state.hostelers.findIndex(h => h.id === action.payload.id);
      if (index !== -1) {
        state.hostelers[index] = action.payload;
      }
    },
    vacateHosteler(state, action: PayloadAction<{ hostelerId: string; vacateDate: string; vacateReason: string }>) {
      const hosteler = state.hostelers.find(h => h.id === action.payload.hostelerId);
      if (hosteler) {
        hosteler.isActive = false;
        hosteler.vacateDate = action.payload.vacateDate;
        hosteler.vacateReason = action.payload.vacateReason;
        hosteler.roomId = ''; // free the room in hosteler profile
        hosteler.isRentOverdue = false;
        hosteler.rentAmountDue = 0;
      }
    },
    transferHostelerRoom(state, action: PayloadAction<{ hostelerId: string; newRoomId: string }>) {
      const hosteler = state.hostelers.find(h => h.id === action.payload.hostelerId);
      if (hosteler) {
        hosteler.roomId = action.payload.newRoomId;
      }
    },
    payHostelerRent(state, action: PayloadAction<{ hostelerId: string; amountPaid: number }>) {
      const hosteler = state.hostelers.find(h => h.id === action.payload.hostelerId);
      if (hosteler) {
        if (hosteler.rentAmountDue) {
          hosteler.rentAmountDue = Math.max(0, hosteler.rentAmountDue - action.payload.amountPaid);
          if (hosteler.rentAmountDue === 0) {
            hosteler.isRentOverdue = false;
          }
        }
      }
    },
    setHostelers(state, action: PayloadAction<Hosteler[]>) {
      state.hostelers = action.payload;
    }
  },
});

export const { addHosteler, editHosteler, vacateHosteler, transferHostelerRoom, payHostelerRent, setHostelers } = hostelersSlice.actions;
export default hostelersSlice.reducer;
