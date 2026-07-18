import store from '../redux/store';
import { loginStart, loginSuccess, loginFailure, logout, changePasswordSuccess } from '../redux/slices/authSlice';
import { addLog } from '../redux/slices/logsSlice';
import { User } from '../types';
import apiClient from './apiClient';

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    store.dispatch(loginStart());
    try {
      const cleanEmail = email.trim().toLowerCase();
      // 1. Post to login endpoint
      const response = await apiClient.post('/auth/login', {
        email: cleanEmail,
        password
      });
      const { token } = response.data;

      // 2. Fetch authenticated profile details
      const profileResponse = await apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profile = profileResponse.data;

      const user: User = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role === 'super_admin' ? 'super_admin' : 'owner',
        hostelsAssigned: profile.hostels_assigned
      };

      const activeHostelId = user.hostelsAssigned && user.hostelsAssigned.length > 0
        ? user.hostelsAssigned[0]
        : null;

      // 3. Dispatch to store
      store.dispatch(loginSuccess({
        user,
        token,
        activeHostelId: activeHostelId || undefined
      }));

      store.dispatch(addLog({
        userId: user.id,
        userName: user.name,
        action: user.role === 'super_admin' ? 'Logged in to Super Admin Panel' : 'Logged in to Owner Panel',
      }));

      return user;
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || 'Invalid email or password';
      store.dispatch(loginFailure(errMsg));
      throw new Error(errMsg);
    }
  },

  logout: async (): Promise<void> => {
    const user = store.getState().auth.user;
    if (user) {
      store.dispatch(addLog({
        userId: user.id,
        userName: user.name,
        action: 'Logged out of system',
      }));
    }
    store.dispatch(logout());
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    store.dispatch(loginStart());
    try {
      const user = store.getState().auth.user;
      if (!user) {
        throw new Error('Not authenticated');
      }

      await apiClient.post('/auth/change-password', {
        current_password: oldPassword,
        new_password: newPassword
      });

      store.dispatch(changePasswordSuccess());
      store.dispatch(addLog({
        userId: user.id,
        userName: user.name,
        action: 'Changed password successfully',
      }));
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to change password';
      store.dispatch(loginFailure(errMsg));
      throw new Error(errMsg);
    }
  }
};
