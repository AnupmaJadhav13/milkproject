/**
 * Direct FCM push notification service.
 *
 * Required Render env:
 * - FIREBASE_SERVICE_ACCOUNT_JSON: full Firebase service account JSON string
 *   or base64 encoded JSON string.
 */

const admin = require('firebase-admin');

let firebaseReady = false;

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  try {
    const json = raw.trim().startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(json);

    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    return serviceAccount;
  } catch (error) {
    console.error('[FCM] Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', error.message);
    return null;
  }
}

function ensureFirebase() {
  if (firebaseReady) return true;

  if (admin.apps.length > 0) {
    firebaseReady = true;
    return true;
  }

  const serviceAccount = parseServiceAccount();
  if (!serviceAccount) {
    console.error('[FCM] Firebase service account env is missing');
    return false;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseReady = true;
    console.log('[FCM] Firebase Admin initialized');
    return true;
  } catch (error) {
    console.error('[FCM] Firebase Admin init failed:', error.message);
    return false;
  }
}

function stringifyData(data = {}) {
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = typeof value === 'string' ? value : String(value);
    }
    return acc;
  }, {});
}

function buildMessage(token, notification) {
  return {
    token,
    notification: {
      title: notification.title || 'Sarvasvaa Dairy',
      body: notification.body || '',
    },
    data: stringifyData(notification.data),
    android: {
      priority: 'high',
      notification: {
        channelId: 'default',
        sound: 'default',
        priority: 'high',
        visibility: 'public',
      },
    },
  };
}

async function sendPushNotification(pushToken, notification) {
  try {
    if (!pushToken) {
      return { success: false, error: 'Missing FCM token' };
    }

    if (!ensureFirebase()) {
      return { success: false, error: 'Firebase Admin is not configured' };
    }

    const response = await admin.messaging().send(buildMessage(pushToken, notification));
    console.log('[FCM] Push notification sent:', response);

    return {
      success: true,
      messageId: response,
    };
  } catch (error) {
    console.error('[FCM] Error sending push notification:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function sendBulkPushNotifications(notifications) {
  try {
    if (!ensureFirebase()) {
      return { success: false, error: 'Firebase Admin is not configured' };
    }

    const messages = notifications
      .filter((notification) => notification.pushToken)
      .map((notification) => buildMessage(notification.pushToken, notification));

    if (messages.length === 0) {
      return { success: false, error: 'No valid FCM tokens provided' };
    }

    const result = await admin.messaging().sendEach(messages);
    console.log(`[FCM] Sent ${result.successCount}/${messages.length} push notifications`);

    return {
      success: result.successCount > 0,
      totalSent: result.successCount,
      totalFailed: result.failureCount,
      responses: result.responses,
    };
  } catch (error) {
    console.error('[FCM] Error sending bulk push notifications:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

function isValidFcmToken(pushToken) {
  return typeof pushToken === 'string' && pushToken.trim().length > 20;
}

module.exports = {
  sendPushNotification,
  sendBulkPushNotifications,
  isValidFcmToken,
};
