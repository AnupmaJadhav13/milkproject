/**
 * Push Notification Service using Expo Push Notifications
 * 
 * This service handles sending push notifications to farmers' devices
 * using the Expo Push Notification API.
 */

const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send push notification to a single device
 * 
 * @param {string} pushToken - Expo push token (starts with ExponentPushToken[...])
 * @param {object} notification - Notification data
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body/message
 * @param {object} notification.data - Additional data to send with notification
 * @returns {Promise<object>} Result of push notification send
 */
async function sendPushNotification(pushToken, notification) {
  try {
    // Check that the push token is valid
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return {
        success: false,
        error: 'Invalid push token'
      };
    }

    // Construct the message
    const message = {
      to: pushToken,
      sound: 'default',
      title: notification.title || 'New Notification',
      body: notification.body || '',
      data: notification.data || {},
      priority: 'high',
      channelId: 'default', // For Android
    };

    // Send the notification
    const ticket = await expo.sendPushNotificationsAsync([message]);
    
    console.log('✅ Push notification sent:', ticket);
    
    return {
      success: true,
      ticket: ticket[0]
    };

  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send push notifications to multiple devices
 * 
 * @param {Array<object>} notifications - Array of notification objects
 * @param {string} notifications[].pushToken - Expo push token
 * @param {string} notifications[].title - Notification title
 * @param {string} notifications[].body - Notification body
 * @param {object} notifications[].data - Additional data
 * @returns {Promise<object>} Results of all push notifications
 */
async function sendBulkPushNotifications(notifications) {
  try {
    // Filter out invalid tokens and construct messages
    const messages = [];
    
    for (const notif of notifications) {
      if (!Expo.isExpoPushToken(notif.pushToken)) {
        console.warn(`Skipping invalid push token: ${notif.pushToken}`);
        continue;
      }

      messages.push({
        to: notif.pushToken,
        sound: 'default',
        title: notif.title || 'New Notification',
        body: notif.body || '',
        data: notif.data || {},
        priority: 'high',
        channelId: 'default',
      });
    }

    if (messages.length === 0) {
      return {
        success: false,
        error: 'No valid push tokens provided'
      };
    }

    // Split messages into chunks of 100 (Expo's limit)
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    // Send each chunk
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending chunk:', error);
      }
    }

    console.log(`✅ Sent ${tickets.length} push notifications`);

    return {
      success: true,
      totalSent: tickets.length,
      tickets
    };

  } catch (error) {
    console.error('❌ Error sending bulk push notifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check receipt status of sent notifications
 * This is useful for tracking delivery and handling errors
 * 
 * @param {Array<string>} receiptIds - Array of receipt IDs from tickets
 * @returns {Promise<object>} Receipt information
 */
async function checkPushNotificationReceipts(receiptIds) {
  try {
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    const receipts = [];

    for (const chunk of receiptIdChunks) {
      try {
        const receiptChunk = await expo.getPushNotificationReceiptsAsync(chunk);
        receipts.push(receiptChunk);
      } catch (error) {
        console.error('Error fetching receipts:', error);
      }
    }

    return {
      success: true,
      receipts
    };

  } catch (error) {
    console.error('❌ Error checking receipts:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validate if a push token is valid Expo push token
 * 
 * @param {string} pushToken - Token to validate
 * @returns {boolean} True if valid
 */
function isValidExpoPushToken(pushToken) {
  return Expo.isExpoPushToken(pushToken);
}

module.exports = {
  sendPushNotification,
  sendBulkPushNotifications,
  checkPushNotificationReceipts,
  isValidExpoPushToken
};
