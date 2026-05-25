import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider, useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistGate } from 'redux-persist/integration/react';
import Toast from 'react-native-toast-message';
import AppNavigator from './src/navigation/AppNavigator';
import NotificationSocketBridge from './src/components/NotificationSocketBridge';
import store, { persistor } from './src/redux/store';
import {
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  setBadgeCountAsync
} from './src/services/pushNotificationService';
import { authApi } from './src/api/api';

// Component to handle push notifications
function PushNotificationHandler() {
  const { user, token } = useSelector((state) => state.auth);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Only register for push notifications if user is a farmer
    if (user && user.role === 'farmer' && token) {
      registerAndSavePushToken();
    }

    // Set up notification listeners
    notificationListener.current = addNotificationReceivedListener(notification => {
      console.log('📬 Notification received in foreground:', notification);
      // You can show a custom in-app notification here if needed
    });

    responseListener.current = addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      // Handle notification tap - navigate to notification screen
      const data = response.notification.request.content.data;
      if (data.notificationId) {
        // TODO: Navigate to notification detail screen
        console.log('Navigate to notification:', data.notificationId);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user, token]);

  const registerAndSavePushToken = async () => {
    try {
      const expoPushToken = await registerForPushNotificationsAsync();
      
      if (expoPushToken) {
        console.log('📱 Saving push token to backend...');
        await authApi.savePushToken(expoPushToken, token);
        console.log('✅ Push token saved successfully');
      }
    } catch (error) {
      console.error('❌ Error saving push token:', error);
    }
  };

  return null;
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <NotificationSocketBridge />
          <PushNotificationHandler />
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
          <Toast />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}
