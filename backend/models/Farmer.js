const mongoose = require('mongoose');

const farmerSchema = mongoose.Schema({
  fullName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  alternativeNumber: { type: String },
  address: { type: String, required: true },
  village: { type: String, required: true },
  aadhaarNumber: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  bankName: { type: String, required: true },
  ifscCode: { type: String, required: true },
  accountNumber: { type: String, required: true },
  accountHolderName: { type: String, required: true },
  branchName: { type: String, required: true },
  assignedCenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollectionCenter',
    required: true
  },
  animalType: { type: String, enum: ['Cow', 'Buffalo', 'Both'], required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  photo: { type: String },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Farmer', farmerSchema);
