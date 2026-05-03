const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const collectionHeadSchema = mongoose.Schema({
  fullName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  alternativeMobileNumber: { type: String },
  email: { type: String },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePhoto: { type: String },
  assignedCenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollectionCenter',
    required: true
  },
  role: { type: String, default: 'collection_head' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

collectionHeadSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

collectionHeadSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('CollectionHead', collectionHeadSchema);
