const mongoose = require('mongoose');

const foodRecordSchema = mongoose.Schema({
  collectionCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollectionCenter',
    required: true
  },
  collectionHeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollectionCenter',
    required: true
  },
  collectionHeadName: {
    type: String
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  animalType: {
    type: String,
    enum: ['Cow', 'Buffalo'],
    required: true
  },
  foodType: {
    type: String,
    enum: ['Cattle Feed', 'Buffalo Feed', 'Mineral Mix', 'Dry Fodder', 'Green Fodder', 'Protein Mix', 'Other'],
    required: true
  },
  brandName: {
    type: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    enum: ['Bag', 'KG', 'Packet', 'Liter'],
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending'
  },
  notes: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('FoodRecord', foodRecordSchema);