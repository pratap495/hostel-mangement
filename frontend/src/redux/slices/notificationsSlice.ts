import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppNotification } from '../../types';
import { mockNotifications } from '../mockData';

interface NotificationsState {
  notifications: AppNotification[];
  loading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  notifications: mockNotifications,
  loading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Omit<AppNotification, 'id' | 'isRead' | 'date'>>) {
      const newId = `notif-${state.notifications.length + 1}`;
      state.notifications.unshift({
        ...action.payload,
        id: newId,
        isRead: false,
        date: new Date().toISOString(),
      });
    },
    markAsRead(state, action: PayloadAction<string>) {
      const notif = state.notifications.find(n => n.id === action.payload);
      if (notif) {
        notif.isRead = true;
      }
    },
    markAllAsRead(state, action: PayloadAction<string | undefined>) {
      // If hostelId is provided, mark only that hostel's notifications as read
      const hostelId = action.payload;
      state.notifications.forEach(n => {
        if (!hostelId || n.hostelId === hostelId) {
          n.isRead = true;
        }
      });
    },
    setNotifications(state, action: PayloadAction<AppNotification[]>) {
      state.notifications = action.payload;
    }
  },
});

export const { addNotification, markAsRead, markAllAsRead, setNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;
