const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const FAST2SMS_SENDER_ID = process.env.FAST2SMS_SENDER_ID || 'FSTSMS';
const FAST2SMS_ROUTE = process.env.FAST2SMS_ROUTE || 'v3';

const sendSMS = async (phoneNumber, data) => {
  if (!FAST2SMS_API_KEY) {
    throw new Error('FAST2SMS_API_KEY is not configured');
  }

  const message = `Dear ${data.farmerName},\nYou received:\n${data.quantity} ${data.unit} ${data.foodType}\nRate: ₹${data.rate} per ${data.unit}\nTotal Amount: ₹${data.totalAmount}\n\nCollection Center: ${data.centerName}`;

  const payload = {
    route: FAST2SMS_ROUTE,
    sender_id: FAST2SMS_SENDER_ID,
    message,
    language: 'english',
    flash: 0,
    numbers: phoneNumber
  };

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      Authorization: FAST2SMS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const dataResponse = await response.json();
  if (!response.ok || dataResponse.return !== true) {
    throw new Error(`Fast2SMS error: ${dataResponse.message || 'SMS not delivered'}`);
  }

  console.log('SMS sent successfully to', phoneNumber);
};

const sendBonusEligibleSMS = async (phoneNumber, data) => {
  if (!FAST2SMS_API_KEY) {
    console.warn('FAST2SMS_API_KEY not set — skipping annual bonus SMS');
    return false;
  }

  const message = `Dear ${data.farmerName},\nCongratulations! You have completed 365+ days of milk supply with total value ₹${Math.round(data.totalInr)} at ${data.centerName}. You are eligible for the annual bonus from the owner. Please contact your collection center.\n\n- Milk Procurement`;

  const payload = {
    route: FAST2SMS_ROUTE,
    sender_id: FAST2SMS_SENDER_ID,
    message,
    language: 'english',
    flash: 0,
    numbers: phoneNumber
  };

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      Authorization: FAST2SMS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const dataResponse = await response.json();
  if (!response.ok || dataResponse.return !== true) {
    throw new Error(`Fast2SMS error: ${dataResponse.message || 'SMS not delivered'}`);
  }
  return true;
};

const sendMilkCollectionSMS = async (phoneNumber, data) => {
  if (!FAST2SMS_API_KEY) {
    console.warn('FAST2SMS_API_KEY not set — skipping milk collection SMS');
    return false;
  }
  const message = `Dear Farmer,\nToday's milk submitted successfully.\n\nMilk: ${data.quantityLiters} Liters\nAnimal: ${data.animalType}\nFAT: ${data.fat}\nSNF: ${data.snf}\nRate: ₹${data.ratePerLiter}/L\nTotal Amount: ₹${data.totalAmount}\n\nCollection Center: ${data.centerName}`;
  const payload = {
    route: FAST2SMS_ROUTE,
    sender_id: FAST2SMS_SENDER_ID,
    message,
    language: 'english',
    flash: 0,
    numbers: phoneNumber
  };
  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      Authorization: FAST2SMS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const dataResponse = await response.json();
  if (!response.ok || dataResponse.return !== true) {
    throw new Error(`Fast2SMS error: ${dataResponse.message || 'SMS not delivered'}`);
  }
  return true;
};

const normalizeIndianMobile = (raw) => {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(-10);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(-10);
  if (digits.length === 10) return digits;
  return null;
};

/**
 * Send same SMS text to multiple numbers (comma-separated for Fast2SMS bulk).
 * @returns {{ sent: number, skipped: string[], errors: string[] }}
 */
const sendBulkRawSMS = async (message, phoneNumbers) => {
  if (!FAST2SMS_API_KEY) {
    throw new Error('FAST2SMS_API_KEY is not configured');
  }
  const normalized = [...new Set((phoneNumbers || []).map(normalizeIndianMobile).filter(Boolean))];
  if (normalized.length === 0) {
    throw new Error('No valid phone numbers to send');
  }
  const numbers = normalized.join(',');
  const payload = {
    route: FAST2SMS_ROUTE,
    sender_id: FAST2SMS_SENDER_ID,
    message: String(message).slice(0, 1500),
    language: 'english',
    flash: 0,
    numbers
  };

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      Authorization: FAST2SMS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const dataResponse = await response.json();
  if (!response.ok || dataResponse.return !== true) {
    throw new Error(`Fast2SMS error: ${dataResponse.message || 'SMS not delivered'}`);
  }

  return { sent: normalized.length, skipped: [], errors: [] };
};

module.exports = {
  sendSMS,
  sendBonusEligibleSMS,
  sendMilkCollectionSMS,
  sendBulkRawSMS,
  normalizeIndianMobile
};