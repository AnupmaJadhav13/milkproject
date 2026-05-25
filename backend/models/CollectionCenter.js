const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const collectionHeadSchema = mongoose.Schema({
  fullName: { type: String },
  mobileNumber: { type: String },
  alternativeMobileNumber: { type: String },
  email: { type: String },
  username: { type: String },
  password: { type: String },
  profilePhoto: { type: String },
  role: { type: String, default: 'collection_head' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  
  // ── Push Notification Fields ───────────────────────────────────────────────
  /** Expo push notification token for collection head's device */
  expoPushToken: { type: String, default: null },
  /** Last time push token was updated */
  pushTokenUpdatedAt: { type: Date, default: null }
}, { _id: false });

const collectionCenterSchema = mongoose.Schema({
  name: { type: String, required: true },
  centerCode: { type: String, required: true, unique: true },
  fullAddress: { type: String, required: true },
  village: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  collectionHead: { type: collectionHeadSchema, default: () => ({}) }
}, { timestamps: true });

collectionCenterSchema.pre('save', async function (next) {
  if (this.isModified('collectionHead.password')) {
    const salt = await bcrypt.genSalt(10);
    this.collectionHead.password = await bcrypt.hash(this.collectionHead.password, salt);
  }
  next();
});

module.exports = mongoose.model('CollectionCenter', collectionCenterSchema);
