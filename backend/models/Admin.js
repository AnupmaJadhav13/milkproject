const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String },
  role: { type: String, default: 'admin' }
}, { timestamps: true });

adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('Admin', adminSchema);
