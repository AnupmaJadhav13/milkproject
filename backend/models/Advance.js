const mongoose = require('mongoose');

const advanceSchema = mongoose.Schema(
  {
    farmerCode: { type: String, required: true, index: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    collectionCenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'CollectionCenter', required: true },
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
