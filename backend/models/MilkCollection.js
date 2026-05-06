const mongoose = require('mongoose');

const milkCollectionSchema = mongoose.Schema(
  {
    farmerCode: { type: String, required: true, index: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    collectionCenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'CollectionCenter', required: true },
    collectionHeadName: { type: String },
    date: { type: Date, required: true },
    shift: { type: String, enum: ['Morning', 'Evening'], required: true },
    animalType: { type: String, enum: ['Cow', 'Buffalo'], required: true },
    quantityLiters: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
    snf: { type: Number, required: true, min: 0 },
    ratePerLiter: { type: Number, required: true, min: 0 },
    amountInr: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

milkCollectionSchema.index({ farmerId: 1, collectionCenterId: 1, date: 1, shift: 1 }, { unique: true });
milkCollectionSchema.index({ collectionCenterId: 1, date: -1 });
milkCollectionSchema.index({ date: -1, animalType: 1, shift: 1 });
milkCollectionSchema.index({ farmerCode: 1, collectionCenterId: 1 });

module.exports = mongoose.model('MilkCollection', milkCollectionSchema);
