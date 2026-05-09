const mongoose = require('mongoose');

const payableSchema = mongoose.Schema(
  {
    farmerCode: { type: String, required: true, index: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    collectionCenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'CollectionCenter', required: true },
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },
    // auto-calculated fields
    totalMilkIncome: { type: Number, default: 0 },
    totalMilkQuantity: { type: Number, default: 0 },
    totalAdvanceDeducted: { type: Number, default: 0 },
    totalFoodExpenses: { type: Number, default: 0 },
    finalPayableAmount: { type: Number, default: 0 },  // positive = pay farmer, negative = carry forward
    remainingAdvanceBalance: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Cleared', 'Carry Forward'],
      default: 'Pending'
    },
    // snapshot of weekly breakdown
    weeklyBreakdown: [
      {
        week: Number,
        startDate: Date,
        endDate: Date,
        milkQuantity: Number,
        milkIncome: Number
      }
    ]
  },
  { timestamps: true }
);

payableSchema.index({ farmerId: 1, collectionCenterId: 1, month: 1, year: 1 }, { unique: true });
payableSchema.index({ collectionCenterId: 1, year: 1, month: 1 });

module.exports = mongoose.model('Payable', payableSchema);
