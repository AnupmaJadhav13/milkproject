import * as Yup from 'yup';

// ── Reusable field validators ─────────────────────────────────────────────────

const indianMobile = Yup.string()
  .required('Mobile number is required')
  .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

const optionalIndianMobile = Yup.string()
  .nullable()
  .transform((v) => (v === '' ? null : v))
  .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')
  .optional();

const ifscCode = Yup.string()
  .required('IFSC code is required')
  .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid IFSC code (e.g. SBIN0001234)')
  .uppercase();

const accountNumber = Yup.string()
  .required('Account number is required')
  .matches(/^\d{9,18}$/, 'Account number must be 9–18 digits');

const nonEmptyString = (label) =>
  Yup.string()
    .required(`${label} is required`)
    .test('not-blank', `${label} cannot be blank`, (v) => !!v && v.trim().length > 0);

const positiveNumber = (label) =>
  Yup.number()
    .typeError(`${label} must be a number`)
    .required(`${label} is required`)
    .positive(`${label} must be greater than 0`);

// ── Auth ──────────────────────────────────────────────────────────────────────

export const loginSchema = Yup.object().shape({
  username: Yup.string()
    .required('Username is required')
    .test('not-blank', 'Username cannot be blank', (v) => !!v && v.trim().length > 0),
  password: Yup.string()
    .required('Password is required')
    .min(1, 'Password is required')
});

export const changePasswordSchema = Yup.object().shape({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .required('New password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('newPassword')], 'Passwords do not match')
});

export const farmerPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .required('Password is required')
    .min(4, 'Password must be at least 4 characters'),
  confirmPassword: Yup.string()
    .required('Please confirm password')
    .oneOf([Yup.ref('password')], 'Passwords do not match')
});

// ── Collection Center ─────────────────────────────────────────────────────────

const collectionHeadSchema = Yup.object().shape({
  fullName: Yup.string().optional(),
  mobileNumber: optionalIndianMobile,
  alternativeMobileNumber: optionalIndianMobile,
  username: Yup.string().optional(),
  password: Yup.string().optional()
});

export const centerSchema = Yup.object().shape({
  name: nonEmptyString('Center name'),
  fullAddress: nonEmptyString('Full address'),
  village: nonEmptyString('Village'),
  district: nonEmptyString('District'),
  state: nonEmptyString('State'),
  pincode: Yup.string()
    .required('Pincode is required')
    .matches(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  collectionHead: collectionHeadSchema
});

// ── Farmer ────────────────────────────────────────────────────────────────────

export const farmerSchema = Yup.object().shape({
  fullName: nonEmptyString('Farmer full name'),
  mobileNumber: indianMobile,
  alternativeNumber: optionalIndianMobile,
  address: nonEmptyString('Address'),
  village: nonEmptyString('Village'),
  bankName: nonEmptyString('Bank name'),
  ifscCode,
  accountNumber,
  accountHolderName: nonEmptyString('Account holder name'),
  assignedCenter: Yup.string().required('Assigned center is required'),
  animalType: Yup.string()
    .oneOf(['Cow', 'Buffalo', 'Both'], 'Select a valid animal type')
    .required('Animal type is required'),
  status: Yup.string()
    .oneOf(['Active', 'Inactive'], 'Select a valid status')
    .required('Status is required')
});

// ── Food Record ───────────────────────────────────────────────────────────────

export const foodSchema = Yup.object().shape({
  farmerId: Yup.string().required('Farmer is required'),
  animalType: Yup.string()
    .required('Animal type is required')
    .oneOf(['Cow', 'Buffalo'], 'Select Cow or Buffalo'),
  foodType: Yup.string()
    .required('Food type is required')
    .oneOf(['Cattle Feed', 'Buffalo Feed', 'Mineral Mix', 'Dry Fodder', 'Green Fodder', 'Protein Mix', 'Other'], 'Select a valid food type'),
  quantity: Yup.number()
    .typeError('Quantity must be a number')
    .required('Quantity is required')
    .positive('Quantity must be greater than 0')
    .max(10000, 'Quantity seems too high'),
  unit: Yup.string()
    .required('Unit is required')
    .oneOf(['Bag', 'KG', 'Packet', 'Liter'], 'Select a valid unit'),
  rate: Yup.number()
    .typeError('Rate must be a number')
    .required('Rate is required')
    .positive('Rate must be greater than 0')
    .max(100000, 'Rate seems too high'),
  paymentStatus: Yup.string()
    .required('Payment status is required')
    .oneOf(['Pending', 'Paid'], 'Select Pending or Paid'),
  notes: Yup.string().optional().max(500, 'Notes too long')
});

// ── Milk Collection ───────────────────────────────────────────────────────────

export const milkEntrySchema = Yup.object().shape({
  farmerId: Yup.string().required('Farmer is required'),
  date: Yup.date()
    .typeError('Invalid date')
    .required('Date is required')
    .max(new Date(), 'Date cannot be in the future'),
  shift: Yup.string()
    .required('Shift is required')
    .oneOf(['Morning', 'Evening'], 'Select Morning or Evening'),
  animalType: Yup.string()
    .required('Animal type is required')
    .oneOf(['Cow', 'Buffalo'], 'Select Cow or Buffalo'),
  quantityLiters: Yup.number()
    .typeError('Quantity must be a number')
    .required('Milk quantity is required')
    .positive('Quantity must be greater than 0')
    .max(500, 'Quantity seems too high (max 500L)'),
  fat: Yup.number()
    .typeError('FAT must be a number')
    .required('FAT is required')
    .min(2.0, 'FAT must be at least 2.0')
    .max(10.0, 'FAT cannot exceed 10.0'),
  snf: Yup.number()
    .typeError('SNF must be a number')
    .required('SNF is required')
    .min(6.0, 'SNF must be at least 6.0')
    .max(12.0, 'SNF cannot exceed 12.0'),
  notes: Yup.string().optional().max(500, 'Notes too long')
});

// ── Advance ───────────────────────────────────────────────────────────────────

export const advanceSchema = Yup.object().shape({
  farmerId: Yup.string().required('Farmer is required'),
  advanceAmount: Yup.number()
    .typeError('Amount must be a number')
    .required('Advance amount is required')
    .positive('Amount must be greater than 0')
    .max(1000000, 'Amount seems too high'),
  advanceDate: Yup.date()
    .typeError('Invalid date')
    .required('Date is required')
    .max(new Date(), 'Date cannot be in the future'),
  paymentMethod: Yup.string()
    .required('Payment method is required')
    .oneOf(['Cash', 'Bank Transfer', 'UPI'], 'Select a valid payment method'),
  notes: Yup.string().optional().max(500, 'Notes too long')
});

// ── Report Date Range ─────────────────────────────────────────────────────────

export const reportDateSchema = Yup.object().shape({
  fromDate: Yup.date()
    .typeError('Invalid from date')
    .required('From date is required'),
  toDate: Yup.date()
    .typeError('Invalid to date')
    .required('To date is required')
    .min(Yup.ref('fromDate'), 'To date must be after from date')
    .max(new Date(), 'To date cannot be in the future')
});

// ── Rate Chart ────────────────────────────────────────────────────────────────

export const rateChartSchema = Yup.object().shape({
  baseRate: positiveNumber('Base rate'),
  fatStepInr: Yup.number()
    .typeError('FAT step must be a number')
    .required('FAT step is required')
    .min(0, 'FAT step cannot be negative'),
  snfStepInr: Yup.number()
    .typeError('SNF step must be a number')
    .required('SNF step is required')
    .min(0, 'SNF step cannot be negative'),
  fatMin: Yup.number()
    .typeError('FAT min must be a number')
    .required('FAT min is required')
    .min(0).max(10),
  fatMax: Yup.number()
    .typeError('FAT max must be a number')
    .required('FAT max is required')
    .min(Yup.ref('fatMin'), 'FAT max must be greater than FAT min'),
  snfMin: Yup.number()
    .typeError('SNF min must be a number')
    .required('SNF min is required')
    .min(0).max(12),
  snfMax: Yup.number()
    .typeError('SNF max must be a number')
    .required('SNF max is required')
    .min(Yup.ref('snfMin'), 'SNF max must be greater than SNF min')
});

// ── Notification / Message ────────────────────────────────────────────────────

export const notificationSchema = Yup.object().shape({
  title: nonEmptyString('Title'),
  message: nonEmptyString('Message')
    .max(2000, 'Message too long (max 2000 characters)')
});
