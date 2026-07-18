import store from '../redux/store';
import { addRoom, editRoom, setRooms } from '../redux/slices/roomsSlice';
import { addLog } from '../redux/slices/logsSlice';
import { Room } from '../types';
import apiClient from './apiClient';

export const roomService = {
  getRooms: async (): Promise<Room[]> => {
    try {
      const response = await apiClient.get('/rooms');
      const rooms: Room[] = response.data.map((r: any) => ({
        id: r.id,
        hostelId: store.getState().auth.activeHostelId || '',
        roomNumber: r.room_number,
        floorNumber: r.floor,
        roomType: r.room_type,
        capacity: r.capacity,
        monthlyRent: Number(r.monthly_rent),
        occupiedCount: r.occupiedCount
      }));
      store.dispatch(setRooms(rooms));
      return rooms;
    } catch (error: any) {
      console.error('Failed to get rooms:', error);
      return store.getState().rooms.rooms;
    }
  },

  createRoom: async (room: Omit<Room, 'id' | 'occupiedCount'>): Promise<void> => {
    try {
      const response = await apiClient.post('/rooms', {
        room_number: room.roomNumber,
        floor: room.floorNumber,
        room_type: room.roomType,
        capacity: room.capacity,
        monthly_rent: room.monthlyRent
      });

      const createdRoom: Room = {
        id: response.data.id,
        hostelId: room.hostelId,
        roomNumber: room.roomNumber,
        floorNumber: room.floorNumber,
        roomType: room.roomType,
        capacity: room.capacity,
        monthlyRent: room.monthlyRent,
        occupiedCount: 0
      };

      store.dispatch(addRoom(createdRoom));

      const owner = store.getState().auth.user;
      const hostel = store.getState().hostels.hostels.find(h => h.id === room.hostelId);
      store.dispatch(addLog({
        userId: owner?.id || 'system',
        userName: owner?.name || 'Owner',
        action: `Created Room ${room.roomNumber} on floor ${room.floorNumber}`,
        hostelName: hostel?.name,
      }));
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to create room';
      throw new Error(errMsg);
    }
  },

  updateRoom: async (room: Room): Promise<void> => {
    store.dispatch(editRoom(room));
    const owner = store.getState().auth.user;
    const hostel = store.getState().hostels.hostels.find(h => h.id === room.hostelId);
    store.dispatch(addLog({
      userId: owner?.id || 'system',
      userName: owner?.name || 'Owner',
      action: `Modified Room ${room.roomNumber} details`,
      hostelName: hostel?.name,
    }));
  }
};
