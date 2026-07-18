import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import hostelsReducer from './slices/hostelsSlice';
import ownersReducer from './slices/ownersSlice';
import roomsReducer from './slices/roomsSlice';
import hostelersReducer from './slices/hostelersSlice';
import financeReducer from './slices/financeSlice';
import notificationsReducer from './slices/notificationsSlice';
import logsReducer from './slices/logsSlice';
import foodMenuReducer from './slices/foodMenuSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hostels: hostelsReducer,
    owners: ownersReducer,
    rooms: roomsReducer,
    hostelers: hostelersReducer,
    finance: financeReducer,
    notifications: notificationsReducer,
    logs: logsReducer,
    foodMenu: foodMenuReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Type-safe Redux hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export default store;
