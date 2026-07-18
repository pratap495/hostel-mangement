import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';
import { mockOwners } from '../mockData';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  activeRole: 'super_admin' | 'owner' | null;
  activeHostelId: string | null;
  loading: boolean;
  error: string | null;
  hasLoggedOut: boolean;
  forceReset: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  activeRole: null,
  activeHostelId: null,
  loading: false,
  error: null,
  hasLoggedOut: false,
  forceReset: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
      state.hasLoggedOut = false;
    },
    loginSuccess(state, action: PayloadAction<{ user: User; token: string; activeHostelId?: string; forceReset?: boolean }>) {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.activeRole = action.payload.user.role;
      state.activeHostelId = action.payload.activeHostelId || null;
      state.loading = false;
      state.error = null;
      state.hasLoggedOut = true;
      state.forceReset = action.payload.forceReset || false;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.activeRole = null;
      state.activeHostelId = null;
      state.loading = false;
      state.error = null;
      state.hasLoggedOut = true;
    },
    setActiveHostel(state, action: PayloadAction<string>) {
      state.activeHostelId = action.payload;
    },
    updateProfilePhoto(state, action: PayloadAction<string>) {
      if (state.user) {
        state.user.profilePhoto = action.payload;
      }
    },
    changePasswordSuccess(state) {
      state.loading = false;
      state.error = null;
      state.forceReset = false;
    },
    clearForceReset(state) {
      state.forceReset = false;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setActiveHostel,
  updateProfilePhoto,
  changePasswordSuccess,
  clearForceReset,
} = authSlice.actions;

export default authSlice.reducer;
