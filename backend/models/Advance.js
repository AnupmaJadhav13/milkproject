const mongoose = require('mongoose');

const advanceSchema = mongoose.Schema(
  {
    recipientType: {
      type: String,
      enum: ['farmer', 'collection_center'],
      default: 'farmer',
      index: true
    },
    farmerCode: { type: String, index: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
    collectionCenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'CollectionCenter', required: true },
    collectionHeadName: { type: String, trim: true },
    advanceAmount: { type: Number, required: true, min: 0 },
    remainingAmount: { type: Number, required: true, min: 0 },
    advanceDate: { type: Date, required: true },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'UPI'],
      required: true
    },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ['Active', 'Settled'],
      default: 'Active'
    }
  },
  { timestamps: true }
);

advanceSchema.index({ farmerId: 1, collectionCenterId: 1 });
advanceSchema.index({ farmerCode: 1, collectionCenterId: 1 });

module.exports = mongoose.model('Advance', advanceSchema);
