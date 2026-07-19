import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Hostel } from '../../types';
import { mockHostels } from '../mockData';

interface HostelsState {
  hostels: Hostel[];
  loading: boolean;
  error: string | null;
}

const initialState: HostelsState = {
  hostels: [],
  loading: false,
  error: null,
};

const hostelsSlice = createSlice({
  name: 'hostels',
  initialState,
  reducers: {
    addHostel(state, action: PayloadAction<Hostel>) {
      state.hostels.push(action.payload);
    },
    editHostel(state, action: PayloadAction<Hostel>) {
      const index = state.hostels.findIndex(h => h.id === action.payload.id);
      if (index !== -1) {
        state.hostels[index] = action.payload;
      }
    },
    toggleHostelActive(state, action: PayloadAction<string>) {
      const hostel = state.hostels.find(h => h.id === action.payload);
      if (hostel) {
        hostel.isActive = !hostel.isActive;
      }
    },
    setHostels(state, action: PayloadAction<Hostel[]>) {
      state.hostels = action.payload;
    },
  },
});

export const { addHostel, editHostel, toggleHostelActive, setHostels } = hostelsSlice.actions;
export default hostelsSlice.reducer;
