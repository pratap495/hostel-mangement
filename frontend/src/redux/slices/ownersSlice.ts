import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Owner } from '../../types';
import { mockOwners } from '../mockData';

interface OwnersState {
  owners: Owner[];
  loading: boolean;
  error: string | null;
}

const initialState: OwnersState = {
  owners: [],
  loading: false,
  error: null,
};

const ownersSlice = createSlice({
  name: 'owners',
  initialState,
  reducers: {
    addOwner(state, action: PayloadAction<Owner>) {
      const exists = state.owners.some(o => o.id === action.payload.id);
      if (!exists) {
        state.owners.push(action.payload);
      }
    },
    editOwner(state, action: PayloadAction<Owner>) {
      const index = state.owners.findIndex(o => o.id === action.payload.id);
      if (index !== -1) {
        state.owners[index] = action.payload;
      }
    },
    toggleOwnerActive(state, action: PayloadAction<string>) {
      const owner = state.owners.find(o => o.id === action.payload);
      if (owner) {
        owner.isActive = !owner.isActive;
      }
    },
    assignHostelsToOwner(state, action: PayloadAction<{ ownerId: string; hostelIds: string[] }>) {
      const owner = state.owners.find(o => o.id === action.payload.ownerId);
      if (owner) {
        owner.hostelsAssigned = action.payload.hostelIds;
      }
    },
    setOwners(state, action: PayloadAction<Owner[]>) {
      state.owners = action.payload;
    }
  },
});

export const { addOwner, editOwner, toggleOwnerActive, assignHostelsToOwner, setOwners } = ownersSlice.actions;
export default ownersSlice.reducer;
