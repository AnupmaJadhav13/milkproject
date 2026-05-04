const mongoose = require('mongoose');

const farmerSchema = mongoose.Schema({
  farmerCode: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  alternativeNumber: { type: String },
  address: { type: String, required: true },
  village: { type: String, required: true },
  bankName: { type: String, required: true },
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
  /** Set when annual bonus eligibility SMS was sent */
  annualBonusNotifiedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Farmer', farmerSchema);
