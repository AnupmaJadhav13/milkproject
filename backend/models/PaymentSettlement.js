const mongoose = require('mongoose');

const paymentSettlementSchema = mongoose.Schema(
  {
    farmerCode: { type: String, required: true, index: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    collectionCenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'CollectionCenter', required: true },
    
    // Payment cycle information
    cycleStartDate: { type: Date, required: true },
    cycleEndDate: { type: Date, required: true },
    
    // Calculation breakdown
    totalMilkLitres: { type: Number, required: true, default: 0 },
    totalMilkAmount: { type: Number, required: true, default: 0 },
    totalFoodAmount: { type: Number, required: true, default: 0 },
    totalAdvanceUsed: { type: Number, required: true, default: 0 },
    finalPayableAmount: { type: Number, required: true, default: 0 },
    
    // Payment status tracking
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'AdvanceRemaining'],
      default: 'Pending'
    },
    
    // Additional tracking
    settledAt: { type: Date },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
paymentSettlementSchema.index({ farmerId: 1, collectionCenterId: 1, cycleStartDate: 1 }, { unique: true });
paymentSettlementSchema.index({ collectionCenterId: 1, cycleStartDate: -1 });
paymentSettlementSchema.index({ paymentStatus: 1, cycleStartDate: -1 });

module.exports = mongoose.model('PaymentSettlement', paymentSettlementSchema);
