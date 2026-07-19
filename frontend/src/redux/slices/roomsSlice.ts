import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Room } from '../../types';
import { mockRooms } from '../mockData';

interface RoomsState {
  rooms: Room[];
  loading: boolean;
  error: string | null;
}

const initialState: RoomsState = {
  rooms: [],
  loading: false,
  error: null,
};

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    addRoom(state, action: PayloadAction<Omit<Room, 'id' | 'occupiedCount'>>) {
      const newId = `room-${action.payload.hostelId}-${action.payload.roomNumber}`;
      state.rooms.push({
        ...action.payload,
        id: newId,
        occupiedCount: 0,
      });
    },
    editRoom(state, action: PayloadAction<Room>) {
      const index = state.rooms.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.rooms[index] = action.payload;
      }
    },
    allocateBed(state, action: PayloadAction<string>) {
      const room = state.rooms.find(r => r.id === action.payload);
      if (room && room.occupiedCount < room.capacity) {
        room.occupiedCount += 1;
      }
    },
    vacateBed(state, action: PayloadAction<string>) {
      const room = state.rooms.find(r => r.id === action.payload);
      if (room && room.occupiedCount > 0) {
        room.occupiedCount -= 1;
      }
    },
    transferOccupant(state, action: PayloadAction<{ oldRoomId: string; newRoomId: string }>) {
      const oldRoom = state.rooms.find(r => r.id === action.payload.oldRoomId);
      const newRoom = state.rooms.find(r => r.id === action.payload.newRoomId);
      if (oldRoom && oldRoom.occupiedCount > 0) {
        oldRoom.occupiedCount -= 1;
      }
      if (newRoom && newRoom.occupiedCount < newRoom.capacity) {
        newRoom.occupiedCount += 1;
      }
    },
    setRooms(state, action: PayloadAction<Room[]>) {
      state.rooms = action.payload;
    }
  },
});

export const { addRoom, editRoom, allocateBed, vacateBed, transferOccupant, setRooms } = roomsSlice.actions;
export default roomsSlice.reducer;
