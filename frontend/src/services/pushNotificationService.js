/**
 * Push Notification Service for Frontend
 * Handles Expo Push Notifications registration and management
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Configure how notifications are handled when app is in foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and get Expo Push Token
 * 
 * @returns {Promise<string|null>} Expo push token or null if failed
 */
export async function registerForPushNotificationsAsync() {
  let token = null;

  // Check if running on physical device
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices, not simulators/emulators');
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If permission denied, return null
    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get the Expo push token
    // For Expo Go, projectId is not required
    // For standalone apps, it's automatically configured
    const tokenData = await Notifications.getExpoPushTokenAsync();
    token = tokenData.data;

    console.log('✅ Expo Push Token:', token);

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    return token;

  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Add listener for when notification is received while app is in foreground
 * 
 * @param {Function} callback - Function to call when notification received
 * @returns {Subscription} Subscription object to remove listener
 */
export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add listener for when user taps on notification
 * 
 * @param {Function} callback - Function to call when notification tapped
 * @returns {Subscription} Subscription object to remove listener
 */
export function addNotificationResponseReceivedListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get badge count (number of unread notifications)
 * 
 * @returns {Promise<number>} Badge count
 */
export async function getBadgeCountAsync() {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
}

/**
 * Set badge count
 * 
 * @param {number} count - Badge count to set
 */
export async function setBadgeCountAsync(count) {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
}

/**
 * Clear all notifications
 */
export async function dismissAllNotificationsAsync() {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Error dismissing notifications:', error);
  }
}

/**
 * Schedule a local notification (for testing)
 * 
 * @param {object} notification - Notification content
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {object} notification.data - Additional data
 */
export async function scheduleLocalNotification(notification) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title || 'Test Notification',
        body: notification.body || 'This is a test notification',
        data: notification.data || {},
        sound: 'default',
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Error scheduling local notification:', error);
  }
}
