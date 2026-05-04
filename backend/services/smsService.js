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

module.exports = {
  sendSMS
};