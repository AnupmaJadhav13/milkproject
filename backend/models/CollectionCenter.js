const mongoose = require('mongoose');

const collectionCenterSchema = mongoose.Schema({
  name: { type: String, required: true },
  centerCode: { type: String, required: true, unique: true },
  fullAddress: { type: String, required: true },
  village: { type: String, required: true },
  taluka: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  gpsLocation: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('CollectionCenter', collectionCenterSchema);
