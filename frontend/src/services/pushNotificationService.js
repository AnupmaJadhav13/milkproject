import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return { token: null, provider: 'fcm', status: 'not_physical_device' };
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Sarvasvaa Dairy',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0F766E',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted');
      return { token: null, provider: 'fcm', status: 'permission_denied' };
    }

    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token = typeof tokenData === 'string' ? tokenData : tokenData.data;

    console.log('FCM Push Token obtained');
    return { token, provider: 'fcm', status: 'granted' };
  } catch (error) {
    console.error('Error registering FCM push notifications:', error.message);
    return { token: null, provider: 'fcm', status: 'token_error', error: error.message };
  }
}

export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseReceivedListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

export async function getBadgeCountAsync() {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
}

export async function setBadgeCountAsync(count) {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
}

export async function dismissAllNotificationsAsync() {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Error dismissing notifications:', error);
  }
}

export async function scheduleLocalNotification(notification) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title || 'Test Notification',
        body: notification.body || 'This is a test notification',
        data: notification.data || {},
        sound: 'default',
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error scheduling local notification:', error);
  }
}
