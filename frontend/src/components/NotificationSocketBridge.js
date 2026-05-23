import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  connectNotificationSocket,
  disconnectNotificationSocket
} from '../services/notificationSocket';
import { ROLE_FARMER } from '../constants/roles';

const NotificationSocketBridge = () => {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && user?.role === ROLE_FARMER) {
      connectNotificationSocket(token, dispatch);
      return () => disconnectNotificationSocket();
    }
    disconnectNotificationSocket();
    return undefined;
  }, [dispatch, token, user?.role]);

  return null;
};

export default NotificationSocketBridge;
