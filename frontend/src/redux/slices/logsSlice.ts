import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ActivityLog } from '../../types';
import { mockActivityLogs } from '../mockData';

interface LogsState {
  logs: ActivityLog[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: LogsState = {
  logs: mockActivityLogs,
  unreadCount: 3, // Initial unread notification count
  loading: false,
  error: null,
};

const logsSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    addLog(state, action: PayloadAction<Omit<ActivityLog, 'id' | 'date'>>) {
      const newId = `log-${state.logs.length + 1}`;
      state.logs.unshift({
        ...action.payload,
        id: newId,
        date: new Date().toISOString(),
      });
      state.unreadCount += 1;
    },
    markLogsAsRead(state) {
      state.unreadCount = 0;
    },
  },
});

export const { addLog, markLogsAsRead } = logsSlice.actions;
export default logsSlice.reducer;
