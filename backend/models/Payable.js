const mongoose = require('mongoose');

const payableSchema = mongoose.Schema(
  {
    farmerCode: { type: String, required: true, index: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    collectionCenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'CollectionCenter', required: true },
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },

    // Optional explicit date range (overrides month/year for milk lookup)
    fromDate: { type: Date },
    toDate:   { type: Date },

    // Milk data
    totalMilkIncome: { type: Number, default: 0 },
    totalMilkQuantity: { type: Number, default: 0 },
    totalMilkDays: { type: Number, default: 0 },

    // Pending amounts (raw, before toggle decision)
    totalFoodPending: { type: Number, default: 0 },
    totalAdvanceRemaining: { type: Number, default: 0 },

    // Toggle flags — what admin chose at generation time
    deductAdvance: { type: Boolean, default: false },
    deductFood: { type: Boolean, default: false },

    // Actual deducted amounts (0 if toggle was OFF)
    totalAdvanceDeducted: { type: Number, default: 0 },
    totalFoodExpenses: { type: Number, default: 0 },

    // Final result
    finalPayableAmount: { type: Number, default: 0 },
    remainingAdvanceBalance: { type: Number, default: 0 },

    // Payment cycle label e.g. "May 2026"
    paymentCycle: { type: String },

    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Pending'
    },

    adminApprovalStatus: {
      type: String,
      enum: ['Draft', 'Forwarded'],
      default: 'Draft',
      index: true
    },
    forwardedToAdminAt: { type: Date },
    forwardedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'CollectionCenter' },

    // Weekly breakdown snapshot
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
