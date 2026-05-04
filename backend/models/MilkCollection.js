const mongoose = require('mongoose');

/** Daily milk procurement value (₹) per farmer at a center — used for annual bonus calculation */
const milkCollectionSchema = mongoose.Schema(
  {
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    collectionCenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'CollectionCenter', required: true },
    date: { type: Date, required: true },
    amountInr: { type: Number, required: true, min: 0 },
    quantityLiters: { type: Number, min: 0 },
    notes: { type: String }
  },
  { timestamps: true }
);

milkCollectionSchema.index({ farmerId: 1, collectionCenterId: 1, date: 1 });

module.exports = mongoose.model('MilkCollection', milkCollectionSchema);
