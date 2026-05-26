const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const farmerSchema = mongoose.Schema({
  farmerCode: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  alternativeNumber: { type: String },
  address: { type: String },
  village: { type: String },
  bankName: { type: String },
  ifscCode: { type: String, required: true },
  accountNumber: { type: String, required: true },
  accountHolderName: { type: String, required: true },
  assignedCenterCode: { type: String, required: true },
  assignedCenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollectionCenter',
    required: true
  },
  animalType: { type: String, enum: ['Cow', 'Buffalo', 'Both'], required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  photo: { type: String },
  /** Set when annual bonus eligibility notification was sent */
  annualBonusNotifiedAt: { type: Date },

  // ── Farmer Login Fields ────────────────────────────────────────────────────
  /** Login username = mobileNumber (set automatically) */
  loginUsername: { type: String, sparse: true },
  /** Hashed common password — set/updated by Admin only */
  loginPassword: { type: String, default: null },
  /** Whether farmer login is enabled */
  loginEnabled: { type: Boolean, default: false },
  
  // ── Push Notification Fields ───────────────────────────────────────────────
  /** FCM device token for direct phone push notifications */
  fcmToken: { type: String, default: null },
  /** Expo push notification token kept only for backward compatibility */
  expoPushToken: { type: String, default: null },
  /** Push provider used by the saved token */
  pushProvider: { type: String, enum: ['fcm', 'expo'], default: 'fcm' },
  /** Last time push token was updated */
  pushTokenUpdatedAt: { type: Date, default: null }
}, { timestamps: true });

/**
 * Compare entered password against stored hash.
 */
farmerSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.loginPassword) return false;
  return await bcrypt.compare(enteredPassword, this.loginPassword);
};

/**
 * Hash password before saving if modified.
 * Only applies when loginPassword field is modified.
 */
farmerSchema.pre('save', async function (next) {
  if (!this.isModified('loginPassword') || !this.loginPassword) {
    return next();
  }
  // Don't re-hash if already hashed (starts with $2b$)
  if (this.loginPassword.startsWith('$2b$') || this.loginPassword.startsWith('$2a$')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.loginPassword = await bcrypt.hash(this.loginPassword, salt);
  next();
});

module.exports = mongoose.model('Farmer', farmerSchema);
