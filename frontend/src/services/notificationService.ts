import store from '../redux/store';
import { markAsRead, markAllAsRead, setNotifications } from '../redux/slices/notificationsSlice';
import { AppNotification } from '../types';
import apiClient from './apiClient';

export const notificationService = {
  getNotifications: async (): Promise<AppNotification[]> => {
    try {
      const response = await apiClient.get('/notifications', {
        params: { page: 1, limit: 100 }
      });
      const notifications: AppNotification[] = response.data.data.map((n: any) => ({
        id: n.id,
        hostelId: store.getState().auth.activeHostelId || '',
        title: n.title,
        body: n.body,
        type: n.type || 'occupancy',
        isRead: n.is_read,
        date: n.created_at
      }));
      store.dispatch(setNotifications(notifications));
      return notifications;
    } catch (error: any) {
      console.error('Failed to get notifications:', error);
      return store.getState().notifications.notifications;
    }
  },

  markAsRead: async (notifId: string): Promise<void> => {
    try {
      await apiClient.put(`/notifications/${notifId}/read`);
      store.dispatch(markAsRead(notifId));
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
      store.dispatch(markAsRead(notifId));
    }
  },

  markAllAsRead: async (hostelId?: string): Promise<void> => {
    try {
      const state = store.getState();
      const unread = state.notifications.notifications.filter(n => !n.isRead && (!hostelId || n.hostelId === hostelId));
      for (const n of unread) {
        await apiClient.put(`/notifications/${n.id}/read`);
      }
      store.dispatch(markAllAsRead(hostelId));
    } catch (error: any) {
      console.error('Failed to mark all as read:', error);
      store.dispatch(markAllAsRead(hostelId));
    }
  }
};
