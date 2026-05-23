/**
 * notificationService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * In-app notification system replacing SMS integration.
 * All Marathi notification templates preserved.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Notification = require('../models/Notification');
const { emitToFarmer } = require('../socket');

// ── Core creator ──────────────────────────────────────────────────────────────

/**
 * Create a notification for a farmer.
 * Fire-and-forget safe — errors are logged, not thrown.
 */
const createNotification = async (farmerId, type, title, message, metadata = {}) => {
  try {
    if (!farmerId) return null;
    const notification = await Notification.create({
      farmerId,
      type,
      title,
      message,
      metadata
    });
    const unreadCount = await Notification.countDocuments({ farmerId, isRead: false });
    const payload = notification.toObject();
    emitToFarmer(farmerId, 'notification:new', {
      notification: payload,
      unreadCount
    });
    emitToFarmer(farmerId, 'notification:unread-count', { unreadCount });
    return notification;
  } catch (err) {
    console.error(`[Notification] Failed to create ${type} for farmer ${farmerId}:`, err.message);
    return null;
  }
};

/**
 * Dispatch notification asynchronously (fire-and-forget).
 */
const dispatchNotification = (farmerId, type, title, message, metadata = {}) => {
  createNotification(farmerId, type, title, message, metadata).catch((err) => {
    console.error(`[Notification] dispatchNotification unhandled error (${type}):`, err.message);
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MARATHI NOTIFICATION TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Farmer Registration Notification
 */
const sendFarmerRegistrationNotification = (farmerId, data) => {
  const title = 'नोंदणी यशस्वी';
  const message =
    `नमस्कार ${data.farmerName}, आपले स्वागत आहे.\n` +
    `आपण Sarvasvaa Milk Farmer Group मध्ये यशस्वीरित्या नोंदणी केलेले आहात.\n` +
    `कलेक्शन सेंटर: ${data.centerName || 'आपले केंद्र'}\n` +
    `शेतकरी कोड: ${data.farmerCode}\n` +
    `धन्यवाद.`;
  dispatchNotification(farmerId, 'FARMER_REGISTRATION', title, message, {
    farmerCode: data.farmerCode,
    centerName: data.centerName
  });
};

/**
 * Payment Done Notification
 */
const sendPaymentDoneNotification = (farmerId, data) => {
  const title = 'पेमेंट पूर्ण झाले';
  const message =
    `नमस्कार ${data.farmerName}, आपले पेमेंट यशस्वीरित्या पूर्ण झाले आहे.\n` +
    `रक्कम: ₹${data.amount}\n` +
    `दिनांक: ${data.date}\n` +
    `पेमेंट कालावधी: ${data.cycle}\n` +
    `धन्यवाद.`;
  dispatchNotification(farmerId, 'PAYMENT_DONE', title, message, {
    amount: data.amount,
    date: data.date,
    cycle: data.cycle
  });
};

/**
 * Advance Given Notification
 */
const sendAdvanceNotification = (farmerId, data) => {
  const title = 'आगाऊ रक्कम';
  const message =
    `नमस्कार ${data.farmerName}, आपल्याला आगाऊ रक्कम देण्यात आली आहे.\n` +
    `आगाऊ रक्कम: ₹${data.advanceAmount}\n` +
    `दिनांक: ${data.date}\n` +
    `शिल्लक आगाऊ: ₹${data.remaining}\n` +
    `धन्यवाद.`;
  dispatchNotification(farmerId, 'ADVANCE_GIVEN', title, message, {
    advanceAmount: data.advanceAmount,
    remaining: data.remaining,
    date: data.date
  });
};

/**
 * Annual Bonus Notification
 */
const sendBonusNotification = (farmerId, data) => {
  const title = 'वार्षिक बोनस';
  const message =
    `अभिनंदन ${data.farmerName}, आपण वार्षिक बोनससाठी पात्र ठरलात.\n` +
    `बोनस रक्कम: ₹${Math.round(data.totalInr)}\n` +
    `Sarvasvaa Milk Group तर्फे हार्दिक शुभेच्छा.`;
  dispatchNotification(farmerId, 'ANNUAL_BONUS', title, message, {
    totalInr: data.totalInr,
    centerName: data.centerName
  });
};

/**
 * Food Record Notification
 */
const sendFoodRecordNotification = (farmerId, data) => {
  const title = 'खाद्य नोंद';
  const message =
    `नमस्कार ${data.farmerName}, आपण घेतलेले खाद्य नोंदवले गेले आहे.\n` +
    `खाद्य: ${data.foodName}  प्रमाण: ${data.qty} ${data.unit}\n` +
    `दर: ₹${data.rate}  रक्कम: ₹${data.amount}\n` +
    `दिनांक: ${data.date}`;
  dispatchNotification(farmerId, 'FOOD_RECORD', title, message, {
    foodName: data.foodName,
    qty: data.qty,
    amount: data.amount,
    date: data.date
  });
};

/**
 * Milk Collection Notification
 */
const sendMilkCollectionNotification = (farmerId, data) => {
  const title = 'दूध संकलन नोंद';
  const message =
    `नमस्कार ${data.farmerName}, आजचे दूध संकलन यशस्वीरित्या नोंद झाले आहे.\n` +
    `दिनांक: ${data.date}  वेळ: ${data.shift}\n` +
    `प्राणी: ${data.animalType === 'Cow' ? 'गाय' : 'म्हैस'}\n` +
    `दूध: ${data.liters} लिटर  FAT: ${data.fat}  SNF: ${data.snf}\n` +
    `दर: ₹${data.rate}/लिटर  रक्कम: ₹${data.amount}`;
  dispatchNotification(farmerId, 'MILK_COLLECTION', title, message, {
    date: data.date,
    shift: data.shift,
    liters: data.liters,
    fat: data.fat,
    snf: data.snf,
    amount: data.amount
  });
};

/**
 * Custom Admin Message Notification (replaces Send SMS)
 */
const sendCustomNotification = async (farmerIds, title, message) => {
  if (!farmerIds || farmerIds.length === 0) return { sent: 0, errors: [] };

  const results = { sent: 0, errors: [] };
  const promises = farmerIds.map(async (farmerId) => {
    try {
      await createNotification(farmerId, 'CUSTOM_MESSAGE', title || 'संदेश', message);
      results.sent += 1;
    } catch (err) {
      results.errors.push({ farmerId, error: err.message });
    }
  });

  await Promise.allSettled(promises);
  return results;
};

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  createNotification,
  dispatchNotification,
  sendFarmerRegistrationNotification,
  sendPaymentDoneNotification,
  sendAdvanceNotification,
  sendBonusNotification,
  sendFoodRecordNotification,
  sendMilkCollectionNotification,
  sendCustomNotification
};
