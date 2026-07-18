import store from '../redux/store';
import { addHosteler, editHosteler, vacateHosteler, transferHostelerRoom, setHostelers } from '../redux/slices/hostelersSlice';
import { allocateBed, vacateBed, transferOccupant, setRooms } from '../redux/slices/roomsSlice';
import { addLog } from '../redux/slices/logsSlice';
import { addNotification } from '../redux/slices/notificationsSlice';
import { Hosteler } from '../types';
import apiClient from './apiClient';

export const hostelerService = {
  getHostelers: async (): Promise<Hosteler[]> => {
    try {
      const response = await apiClient.get('/hostelers', {
        params: { page: 1, limit: 100 }
      });
      const hostelers: Hosteler[] = response.data.data.map((h: any) => ({
        id: h.id,
        hostelId: store.getState().auth.activeHostelId || '',
        roomId: h.room_id || '',
        bedNumber: h.bed_number || undefined,
        name: h.name,
        phone: h.phone,
        email: h.email || '',
        permanentAddress: h.permanent_address,
        emergencyContactName: h.emergency_contact_name,
        emergencyContactPhone: h.emergency_contact_phone,
        joiningDate: h.date_of_joining,
        photoUrl: h.photo_url || undefined,
        aadhaarFrontUrl: h.aadhaar_front_url || undefined,
        aadhaarBackUrl: h.aadhaar_back_url || undefined,
        isActive: h.is_active,
        vacateDate: h.date_of_vacating || undefined,
        vacateReason: h.vacate_reason || undefined,
        isRentOverdue: h.is_rent_overdue,
        rentAmountDue: h.rent_amount_due ? Number(h.rent_amount_due) : 0
      }));
      store.dispatch(setHostelers(hostelers));
      return hostelers;
    } catch (error: any) {
      console.error('Failed to get hostelers:', error);
      return store.getState().hostelers.hostelers;
    }
  },

  createHosteler: async (hosteler: Omit<Hosteler, 'id'>): Promise<void> => {
    try {
      // 1. Onboard Hosteler profile in backend
      const hostelerRes = await apiClient.post('/hostelers', {
        name: hosteler.name,
        phone: hosteler.phone,
        email: hosteler.email || null,
        permanent_address: hosteler.permanentAddress,
        emergency_contact_name: hosteler.emergencyContactName,
        emergency_contact_phone: hosteler.emergencyContactPhone,
        date_of_joining: hosteler.joiningDate,
        photo_key: null,
        aadhaar_front_key: null,
        aadhaar_back_key: null
      });

      const hostelerId = hostelerRes.data.id;

      // 2. Determine first vacant bed number in room
      const activeHostelers = store.getState().hostelers.hostelers;
      const roomHostelers = activeHostelers.filter(h => h.roomId === hosteler.roomId && h.isActive);
      const occupiedBeds = roomHostelers.map(h => h.bedNumber || 0);
      let bedNumber = 1;
      while (occupiedBeds.includes(bedNumber)) {
        bedNumber++;
      }

      // 3. Assign bed space in backend
      await apiClient.post('/rooms/assign', {
        hosteler_id: hostelerId,
        room_id: hosteler.roomId,
        bed_number: bedNumber,
        assigned_date: hosteler.joiningDate
      });

      // 4. Update local Redux state
      const newHosteler: Hosteler = {
        ...hosteler,
        id: hostelerId,
        bedNumber
      };

      store.dispatch(allocateBed(hosteler.roomId));
      store.dispatch(addHosteler(newHosteler));

      const owner = store.getState().auth.user;
      const hostel = store.getState().hostels.hostels.find(h => h.id === hosteler.hostelId);
      const targetRoom = store.getState().rooms.rooms.find(r => r.id === hosteler.roomId);

      store.dispatch(addLog({
        userId: owner?.id || 'system',
        userName: owner?.name || 'Owner',
        action: `Registered hosteler ${hosteler.name} to Room ${targetRoom?.roomNumber || 'Unknown'}`,
        hostelName: hostel?.name,
      }));

      // Trigger Alert if room reaches full capacity
      const updatedRoom = store.getState().rooms.rooms.find(r => r.id === hosteler.roomId);
      if (updatedRoom && (updatedRoom.occupiedCount + 1) === updatedRoom.capacity) {
        store.dispatch(addNotification({
          hostelId: hosteler.hostelId,
          title: 'Room Occupancy Alert',
          body: `Room ${updatedRoom.roomNumber} has reached full capacity.`,
          type: 'occupancy',
        }));
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to check in resident';
      throw new Error(errMsg);
    }
  },

  updateHosteler: async (hosteler: Hosteler): Promise<void> => {
    try {
      await apiClient.put(`/hostelers/${hosteler.id}`, {
        name: hosteler.name,
        phone: hosteler.phone,
        email: hosteler.email || null,
        permanent_address: hosteler.permanentAddress,
        emergency_contact_name: hosteler.emergencyContactName,
        emergency_contact_phone: hosteler.emergencyContactPhone
      });

      store.dispatch(editHosteler(hosteler));

      const owner = store.getState().auth.user;
      const hostel = store.getState().hostels.hostels.find(h => h.id === hosteler.hostelId);
      store.dispatch(addLog({
        userId: owner?.id || 'system',
        userName: owner?.name || 'Owner',
        action: `Updated details for hosteler ${hosteler.name}`,
        hostelName: hostel?.name,
      }));
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to update resident profile';
      throw new Error(errMsg);
    }
  },

  vacateHosteler: async (hostelerId: string, vacateDate: string, vacateReason: string): Promise<void> => {
    try {
      const hosteler = store.getState().hostelers.hostelers.find(h => h.id === hostelerId);
      if (!hosteler) throw new Error('Hosteler not found');

      // 1. Vacate resident in backend
      await apiClient.put(`/hostelers/${hostelerId}`, {
        is_active: false,
        date_of_vacating: vacateDate,
        vacate_reason: vacateReason
      });

      const roomId = hosteler.roomId;

      // 2. Mark local state vacated
      if (roomId) {
        store.dispatch(vacateBed(roomId));
      }
      store.dispatch(vacateHosteler({ hostelerId, vacateDate, vacateReason }));

      const owner = store.getState().auth.user;
      const hostel = store.getState().hostels.hostels.find(h => h.id === hosteler.hostelId);
      store.dispatch(addLog({
        userId: owner?.id || 'system',
        userName: owner?.name || 'Owner',
        action: `Marked hosteler ${hosteler.name} as Vacated. Reason: ${vacateReason}`,
        hostelName: hostel?.name,
      }));
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to vacate resident';
      throw new Error(errMsg);
    }
  },

  transferHosteler: async (hostelerId: string, newRoomId: string): Promise<void> => {
    try {
      const hosteler = store.getState().hostelers.hostelers.find(h => h.id === hostelerId);
      if (!hosteler) throw new Error('Hosteler not found');

      const oldRoomId = hosteler.roomId;
      if (oldRoomId === newRoomId) return;

      // Determine first vacant bed number in target room
      const activeHostelers = store.getState().hostelers.hostelers;
      const roomHostelers = activeHostelers.filter(h => h.roomId === newRoomId && h.isActive);
      const occupiedBeds = roomHostelers.map(h => h.bedNumber || 0);
      let bedNumber = 1;
      while (occupiedBeds.includes(bedNumber)) {
        bedNumber++;
      }

      // 1. Execute transfer in backend
      await apiClient.post('/rooms/transfer', {
        hosteler_id: hostelerId,
        new_room_id: newRoomId,
        new_bed_number: bedNumber
      });

      // 2. Sync local Redux states
      store.dispatch(transferOccupant({ oldRoomId, newRoomId }));
      store.dispatch(transferHostelerRoom({ hostelerId, newRoomId }));
      
      // Update bed number in state (via editing modified hosteler)
      const updatedHosteler: Hosteler = {
        ...hosteler,
        roomId: newRoomId,
        bedNumber
      };
      store.dispatch(editHosteler(updatedHosteler));

      const owner = store.getState().auth.user;
      const hostel = store.getState().hostels.hostels.find(h => h.id === hosteler.hostelId);
      const oldRoom = store.getState().rooms.rooms.find(r => r.id === oldRoomId);
      const newRoom = store.getState().rooms.rooms.find(r => r.id === newRoomId);

      store.dispatch(addLog({
        userId: owner?.id || 'system',
        userName: owner?.name || 'Owner',
        action: `Transferred hosteler ${hosteler.name} from Room ${oldRoom?.roomNumber || 'None'} to Room ${newRoom?.roomNumber || 'Unknown'}`,
        hostelName: hostel?.name,
      }));
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to transfer resident';
      throw new Error(errMsg);
    }
  }
};
