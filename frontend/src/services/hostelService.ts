import store from '../redux/store';
import {
  addHostel,
  editHostel,
  toggleHostelActive,
  setHostels,
  fetchHostelsStart,
  fetchHostelsSuccess,
  fetchHostelsFailure
} from '../redux/slices/hostelsSlice';
import { addLog } from '../redux/slices/logsSlice';
import { setActiveHostel } from '../redux/slices/authSlice';
import { Hostel } from '../types';
import apiClient from './apiClient';
import { getStorageUrl } from './storageService';

export const hostelService = {
  getHostels: async (): Promise<Hostel[]> => {
    store.dispatch(fetchHostelsStart());
    try {
      const response = await apiClient.get('/tenants/hostels');
      const hostels: Hostel[] = response.data.map((h: any) => ({
        id: h.id,
        name: h.name,
        address: h.address,
        contactNumber: h.contact_number,
        floorsCount: h.floors_count,
        roomsCount: h.rooms_count,
        imageUrl: getStorageUrl(h.image_url) || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500',
        ownerName: h.owner_name || 'Unassigned',
        ownerEmail: h.owner_email || '',
        ownerPhone: h.owner_phone || '',
        isActive: h.is_active,
        occupiedBeds: h.occupied_beds || 0,
        monthlyIncome: h.monthly_income || 0,
        totalHostelers: h.total_hostelers || 0
      }));
      store.dispatch(fetchHostelsSuccess(hostels));
      return hostels;
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to get hostels';
      console.error('Failed to get hostels:', error);
      store.dispatch(fetchHostelsFailure(errMsg));
      return store.getState().hostels.hostels;
    }
  },

  createHostel: async (hostel: Omit<Hostel, 'id'>): Promise<Hostel> => {
    try {
      const email = hostel.ownerEmail && hostel.ownerEmail.includes('@') ? hostel.ownerEmail.trim().toLowerCase() : null;
      const response = await apiClient.post('/tenants/hostels', {
        name: hostel.name,
        address: hostel.address,
        contact_number: hostel.contactNumber,
        floors_count: hostel.floorsCount,
        rooms_count: hostel.roomsCount,
        owner_email: email,
        image_url: hostel.imageUrl
      });
      
      const createdHostel: Hostel = {
        id: response.data.hostel_id,
        name: hostel.name,
        address: hostel.address,
        contactNumber: hostel.contactNumber,
        floorsCount: hostel.floorsCount,
        roomsCount: hostel.roomsCount,
        imageUrl: hostel.imageUrl || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500',
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
    try {
      const email = hostel.ownerEmail && hostel.ownerEmail.includes('@') ? hostel.ownerEmail.trim().toLowerCase() : null;
      await apiClient.put(`/tenants/hostels/${hostel.id}`, {
        name: hostel.name,
        address: hostel.address,
        contact_number: hostel.contactNumber,
        floors_count: hostel.floorsCount,
        rooms_count: hostel.roomsCount,
        owner_email: email,
        image_url: hostel.imageUrl
      });
      store.dispatch(editHostel(hostel));
      const admin = store.getState().auth.user;
      store.dispatch(addLog({
        userId: admin?.id || 'system',
        userName: admin?.name || 'Admin',
        action: `Updated hostel details: ${hostel.name}`,
      }));
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to update hostel';
      throw new Error(errMsg);
    }
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
