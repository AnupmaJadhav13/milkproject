import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { notificationApi } from '../../api/api';

export const fetchMyNotifications = createAsyncThunk(
  'notifications/fetchMy',
  async ({ token, params }, thunkAPI) => {
    try {
      const res = await notificationApi.getMy(token, params);
      return res.data;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (token, thunkAPI) => {
    try {
      const res = await notificationApi.getUnreadCount(token);
      return res.data.unreadCount;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async ({ token, notificationId }, thunkAPI) => {
    try {
      await notificationApi.markRead(token, notificationId);
      return notificationId;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (token, thunkAPI) => {
    try {
      await notificationApi.markAllRead(token);
      return true;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    list: [],
    unreadCount: 0,
    total: 0,
    totalPages: 1,
    currentPage: 1,
    status: 'idle',
    error: null
  },
  reducers: {
    receiveNotification: (state, action) => {
      const notification = action.payload?.notification || action.payload;
      if (!notification?._id) return;
      const exists = state.list.some((item) => item._id === notification._id);
      if (!exists) state.list.unshift(notification);
      if (typeof action.payload?.unreadCount === 'number') {
        state.unreadCount = action.payload.unreadCount;
      } else if (!notification.isRead && !exists) {
        state.unreadCount += 1;
      }
      state.total += exists ? 0 : 1;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = Math.max(0, Number(action.payload || 0));
    },
    setNotificationReadFromSocket: (state, action) => {
      const id = action.payload?.notificationId;
      const n = state.list.find((x) => x._id === id);
      if (n) n.isRead = true;
      if (typeof action.payload?.unreadCount === 'number') {
        state.unreadCount = action.payload.unreadCount;
      }
    },
    clearNotifications: (state) => {
      state.list = [];
      state.unreadCount = 0;
      state.total = 0;
      state.status = 'idle';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyNotifications.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMyNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload.data || [];
        state.unreadCount = action.payload.unreadCount || 0;
        state.total = action.payload.total || 0;
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
      })
      .addCase(fetchMyNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload || 0;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const id = action.payload;
        const n = state.list.find((x) => x._id === id);
        if (n && !n.isRead) {
          n.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.list.forEach((n) => { n.isRead = true; });
        state.unreadCount = 0;
      });
  }
});

export const {
  clearNotifications,
  receiveNotification,
  setUnreadCount,
  setNotificationReadFromSocket
} = notificationSlice.actions;
export default notificationSlice.reducer;
