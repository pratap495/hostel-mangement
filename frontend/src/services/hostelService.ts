import store from '../redux/store';
import { addHostel, editHostel, toggleHostelActive, setHostels } from '../redux/slices/hostelsSlice';
import { addLog } from '../redux/slices/logsSlice';
import { setActiveHostel } from '../redux/slices/authSlice';
import { Hostel } from '../types';
import apiClient from './apiClient';

export const hostelService = {
  getHostels: async (): Promise<Hostel[]> => {
    try {
      const response = await apiClient.get('/tenants/hostels');
      const hostels: Hostel[] = response.data.map((h: any) => ({
        id: h.id,
        name: h.name,
        address: h.address,
        contactNumber: h.contact_number,
        floorsCount: h.floors_count,
        roomsCount: h.rooms_count,
        imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500',
        ownerName: h.owner_name || 'Unassigned',
        ownerEmail: h.owner_email || '',
        ownerPhone: h.owner_phone || '',
        isActive: h.is_active
      }));
      store.dispatch(setHostels(hostels));
      return hostels;
    } catch (error: any) {
      console.error('Failed to get hostels:', error);
      return store.getState().hostels.hostels;
    }
  },

  createHostel: async (hostel: Omit<Hostel, 'id'>): Promise<Hostel> => {
    try {
      const response = await apiClient.post('/tenants/hostels', {
        name: hostel.name,
        address: hostel.address,
        contact_number: hostel.contactNumber,
        floors_count: hostel.floorsCount,
        rooms_count: hostel.roomsCount,
        owner_email: hostel.ownerEmail
      });
      
      const createdHostel: Hostel = {
        id: response.data.hostel_id,
        name: hostel.name,
        address: hostel.address,
        contactNumber: hostel.contactNumber,
        floorsCount: hostel.floorsCount,
        roomsCount: hostel.roomsCount,
        imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500',
        ownerName: hostel.ownerName,
        ownerEmail: hostel.ownerEmail,
        ownerPhone: hostel.ownerPhone,
        isActive: true
      };

      store.dispatch(addHostel(createdHostel));
      
      const admin = store.getState().auth.user;
      store.dispatch(addLog({
        userId: admin?.id || 'system',
        userName: admin?.name || 'Admin',
        action: `Created new hostel: ${hostel.name}`,
      }));
      
      return createdHostel;
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to create hostel';
      throw new Error(errMsg);
    }
  },

  updateHostel: async (hostel: Hostel): Promise<void> => {
    // Note: Central database holds static config. Update Redux state and log action.
    store.dispatch(editHostel(hostel));
    const admin = store.getState().auth.user;
    store.dispatch(addLog({
      userId: admin?.id || 'system',
      userName: admin?.name || 'Admin',
      action: `Updated hostel details: ${hostel.name}`,
    }));
  },

  toggleHostelStatus: async (hostelId: string): Promise<void> => {
    const hostel = store.getState().hostels.hostels.find(h => h.id === hostelId);
    if (hostel) {
      store.dispatch(toggleHostelActive(hostelId));
      const admin = store.getState().auth.user;
      store.dispatch(addLog({
        userId: admin?.id || 'system',
        userName: admin?.name || 'Admin',
        action: `${hostel.isActive ? 'Deactivated' : 'Activated'} hostel: ${hostel.name}`,
      }));
    }
  },

  selectActiveHostel: (hostelId: string): void => {
    store.dispatch(setActiveHostel(hostelId));
  }
};
