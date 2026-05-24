/**
 * smsService.js  — FIXED VERSION
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixes applied:
 *  1. ✅ Uses axios (reliable, already ecosystem standard) instead of fetch
 *  2. ✅ Correct 2Factor endpoint: /SMS/ (plain text) not /TSMS/ (template)
 *  3. ✅ Phone sent as 10-digit (2Factor requirement for plain-text route)
 *  4. ✅ Full debug logging of request URL + provider response
 *  5. ✅ Proper error extraction from 2Factor response body
 *  6. ✅ sendSmsWithRetry exported for /test-sms route
 * ─────────────────────────────────────────────────────────────────────────────
 */

const axios  = require('axios');
const SmsLog = require('../models/SmsLog');

// ── Config ────────────────────────────────────────────────────────────────────
const SENDER_ID   = () => process.env.SMS_SENDER_ID    || 'SARVAA';
const MAX_RETRIES = parseInt(process.env.SMS_MAX_RETRIES    || '3', 10);
const RETRY_DELAY = parseInt(process.env.SMS_RETRY_DELAY_MS || '2000', 10);

/**
 * Build the 2Factor plain-text SMS URL.
 *
 * ✅ FIX #1 — Endpoint changed from /ADDON_SERVICES/SEND/TSMS  (Template SMS)
 *              to /SMS/<SENDER_ID>/<TO>/<MSG>  (Transactional plain-text SMS).
 *
 * TSMS requires an approved DLT template ID passed as a query param.
 * If you haven't registered and approved templates on 2factor.in, TSMS will
 * always fail silently. Use the plain /SMS/ route for custom messages.
 *
 * Reference: https://help.2factor.in/support/solutions/articles/12000038834
 */
const buildSmsUrl = (phone, message) => {
  const key = process.env.TWOFACTOR_API_KEY;
  if (!key) throw new Error('TWOFACTOR_API_KEY is not configured in .env');

  const encodedMsg = encodeURIComponent(message);
  // Format: GET https://2factor.in/API/V1/{apikey}/SMS/{to}/{message}/{senderid}
  return `https://2factor.in/API/V1/${key}/SMS/${phone}/${encodedMsg}/${SENDER_ID()}`;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normalise any Indian mobile number to a clean 10-digit string.
 * 2Factor plain-text API expects exactly 10 digits (no country code).
 * Returns null if the number is invalid.
 */
const normalizeIndianMobile = (raw) => {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0'))  return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Core HTTP sender (single attempt) ────────────────────────────────────────

/**
 * Send one SMS via 2Factor API using axios.
 * Returns the parsed JSON response from 2Factor.
 * Throws on HTTP error or API-level failure.
 */
const sendViaTwoFactor = async (mobile, message) => {
  const phone = normalizeIndianMobile(mobile);
  if (!phone) {
    throw new Error(`Invalid mobile number: "${mobile}" — must be 10-digit Indian number`);
  }

  const url = buildSmsUrl(phone, message);

  // ── DEBUG: log the full request so you can verify in server logs ──
  console.log(`[SMS DEBUG] Sending to ${phone}`);
  console.log(`[SMS DEBUG] URL: ${url}`);

  let response;
  try {
    response = await axios.get(url, { timeout: 10000 });
  } catch (axiosErr) {
    // Network-level error (DNS, timeout, etc.)
    const errMsg = axiosErr.response
      ? `HTTP ${axiosErr.response.status}: ${JSON.stringify(axiosErr.response.data)}`
      : axiosErr.message;
    throw new Error(`Network error calling 2Factor: ${errMsg}`);
  }

  const data = response.data;
  console.log(`[SMS DEBUG] 2Factor response:`, JSON.stringify(data));

  // 2Factor returns { Status: "Success", Details: "<SessionID>" } on success
  if (!data || data.Status !== 'Success') {
    const reason = data?.Details || data?.Status || JSON.stringify(data) || 'Unknown error';
    throw new Error(`2Factor API rejected SMS: ${reason}`);
  }

  return data; // { Status: 'Success', Details: '<SessionID>' }
};

// ── Retry wrapper ─────────────────────────────────────────────────────────────

/**
 * Send SMS with automatic retry on failure.
 * Logs every attempt to SmsLog collection.
 *
 * @param {string}  mobile     - Recipient mobile number
 * @param {string}  message    - SMS text (Marathi or English)
 * @param {string}  smsType    - One of the SmsLog.smsType enum values
 * @param {string}  [farmerId] - Optional Farmer ObjectId for log linkage
 * @returns {Promise<boolean>} - true if sent, false if all retries exhausted
 */
const sendSmsWithRetry = async (mobile, message, smsType, farmerId = null) => {
  const phone = normalizeIndianMobile(mobile);

  const log = await SmsLog.create({
    farmerId:   farmerId || null,
    mobile:     phone   || mobile,
    smsType,
    message,
    status:     'pending',
    retryCount: 0
  });

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await sendViaTwoFactor(mobile, message);

      log.status           = 'sent';
      log.sentAt           = new Date();
      log.retryCount       = attempt - 1;
      log.sessionId        = result.Details || null;
      log.providerResponse = result;
      log.errorMessage     = null;
      await log.save();

      console.log(`[SMS] ✓ ${smsType} → ${phone} (attempt ${attempt})`);
      return true;

    } catch (err) {
      lastError = err;
      console.warn(`[SMS] ✗ ${smsType} → ${phone} attempt ${attempt}/${MAX_RETRIES}: ${err.message}`);

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY * attempt); // exponential back-off
      }
    }
  }

  // All retries exhausted
  log.status       = 'failed';
  log.retryCount   = MAX_RETRIES;
  log.errorMessage = lastError?.message || 'Unknown error';
  await log.save();

  console.error(`[SMS] ✗✗ ${smsType} → ${phone} FAILED after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`);
  return false;
};

// ── Fire-and-forget wrapper ───────────────────────────────────────────────────

const dispatchSms = (mobile, message, smsType, farmerId = null) => {
  sendSmsWithRetry(mobile, message, smsType, farmerId).catch((err) => {
    console.error(`[SMS] dispatchSms unhandled error (${smsType}):`, err.message);
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MARATHI SMS TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

const sendFarmerRegistrationSMS = (mobile, data, farmerId = null) => {
  const message =
    `नमस्कार ${data.farmerName},\n` +
    `आपले स्वागत आहे.\n` +
    `आपण आता Sarvasvaa Milk Farmer Group मध्ये यशस्वीरित्या नोंदणीकृत झाला आहात.\n` +
    `शेतकरी कोड: ${data.farmerCode}\n` +
    `धन्यवाद.`;
  dispatchSms(mobile, message, 'FARMER_REGISTRATION', farmerId);
};

const sendMilkCollectionSMS = (mobile, data, farmerId = null) => {
  const message =
    `नमस्कार ${data.farmerName},\n` +
    `आजचे दूध संकलन यशस्वीरित्या नोंद झाले आहे.\n` +
    `दिनांक: ${data.date}  वेळ: ${data.shift}\n` +
    `प्राणी: ${data.animalType === 'Cow' ? 'गाय' : 'म्हैस'}\n` +
    `दूध: ${data.liters} लिटर  FAT: ${data.fat}  SNF: ${data.snf}\n` +
    `दर: Rs.${data.rate}/लिटर  रक्कम: Rs.${data.amount}\n` +
    `Sarvasvaa Milk`;
  dispatchSms(mobile, message, 'MILK_COLLECTION', farmerId);
};

const sendFoodRecordSMS = (mobile, data, farmerId = null) => {
  const message =
    `नमस्कार ${data.farmerName},\n` +
    `आपण घेतलेले खाद्य नोंदवले गेले आहे.\n` +
    `खाद्य: ${data.foodName}  प्रमाण: ${data.qty} ${data.unit}\n` +
    `दर: Rs.${data.rate}  रक्कम: Rs.${data.amount}\n` +
    `दिनांक: ${data.date}\n` +
    `Sarvasvaa Milk`;
  dispatchSms(mobile, message, 'FOOD_RECORD', farmerId);
};

const sendPaymentDoneSMS = (mobile, data, farmerId = null) => {
  const message =
    `नमस्कार ${data.farmerName},\n` +
    `आपली Rs.${data.amount} रक्कम यशस्वीरित्या जमा करण्यात आली आहे.\n` +
    `दिनांक: ${data.date}  पेमेंट सायकल: ${data.cycle}\n` +
    `Sarvasvaa Milk`;
  dispatchSms(mobile, message, 'PAYMENT_DONE', farmerId);
};

const sendAdvanceSMS = (mobile, data, farmerId = null) => {
  const message =
    `नमस्कार ${data.farmerName},\n` +
    `आपल्याला Rs.${data.advanceAmount} आगाऊ रक्कम देण्यात आली आहे.\n` +
    `दिनांक: ${data.date}\n` +
    `शिल्लक आगाऊ रक्कम: Rs.${data.remaining}\n` +
    `Sarvasvaa Milk`;
  dispatchSms(mobile, message, 'ADVANCE_GIVEN', farmerId);
};

const sendBonusSMS = (mobile, data, farmerId = null) => {
  const message =
    `अभिनंदन ${data.farmerName}!\n` +
    `आपण वार्षिक बोनससाठी पात्र ठरलात.\n` +
    `एकूण दूध मूल्य: Rs.${data.totalInr}  केंद्र: ${data.centerName}\n` +
    `अधिक माहितीसाठी आपल्या संकलन केंद्राशी संपर्क साधा.\n` +
    `Sarvasvaa Milk`;
  dispatchSms(mobile, message, 'ANNUAL_BONUS', farmerId);
};

const sendCustomSMS = async (message, phoneNumbers, farmerId = null) => {
  const normalized = [
    ...new Set((phoneNumbers || []).map(normalizeIndianMobile).filter(Boolean))
  ];

  if (normalized.length === 0) {
    throw new Error('No valid phone numbers provided');
  }

  const results = { sent: 0, skipped: [], errors: [] };

  const promises = normalized.map(async (phone) => {
    try {
      await sendSmsWithRetry(phone, message, 'CUSTOM_SMS', farmerId);
      results.sent += 1;
    } catch (err) {
      results.errors.push({ phone, error: err.message });
    }
  });

  await Promise.allSettled(promises);
  return results;
};

// ── Legacy aliases ────────────────────────────────────────────────────────────

const sendSMS = (phoneNumber, data) => {
  sendFoodRecordSMS(phoneNumber, {
    farmerName: data.farmerName  || 'शेतकरी',
    foodName:   data.foodType    || data.foodName || '',
    qty:        data.quantity    || '',
    unit:       data.unit        || '',
    rate:       data.rate        || '',
    amount:     data.totalAmount || '',
    date:       new Date().toLocaleDateString('en-IN')
  }, null);
};

const sendBonusEligibleSMS = async (phoneNumber, data) => {
  return sendSmsWithRetry(
    phoneNumber,
    `अभिनंदन ${data.farmerName}!\n` +
    `आपण वार्षिक बोनससाठी पात्र ठरलात.\n` +
    `एकूण दूध मूल्य: Rs.${Math.round(data.totalInr)}\n` +
    `केंद्र: ${data.centerName}\n` +
    `अधिक माहितीसाठी आपल्या संकलन केंद्राशी संपर्क साधा.\n` +
    `Sarvasvaa Milk`,
    'ANNUAL_BONUS',
    null
  );
};

const sendBulkRawSMS = async (message, phoneNumbers) => {
  return sendCustomSMS(message, phoneNumbers);
};

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  sendFarmerRegistrationSMS,
  sendMilkCollectionSMS,
  sendFoodRecordSMS,
  sendPaymentDoneSMS,
  sendAdvanceSMS,
  sendBonusSMS,
  sendCustomSMS,
  normalizeIndianMobile,
  dispatchSms,
  sendSmsWithRetry,
  sendSMS,
  sendBonusEligibleSMS,
  sendBulkRawSMS
};