import { io } from 'socket.io-client';
import { apiBaseUrl } from '../api/api';
import {
  receiveNotification,
  setNotificationReadFromSocket,
  setUnreadCount
} from '../redux/slices/notificationSlice';

let socket;

const getSocketUrl = () => apiBaseUrl.replace(/\/api\/?$/, '');

export const connectNotificationSocket = (token, dispatch) => {
  if (!token) return null;

  if (socket?.connected) return socket;
  if (socket) socket.disconnect();

  socket = io(getSocketUrl(), {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000
  });

  socket.on('notification:new', (payload) => {
    dispatch(receiveNotification(payload));
  });

  socket.on('notification:unread-count', ({ unreadCount }) => {
    dispatch(setUnreadCount(unreadCount));
  });

  socket.on('notification:read', (payload) => {
    dispatch(setNotificationReadFromSocket(payload));
  });

  return socket;
};

export const disconnectNotificationSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
