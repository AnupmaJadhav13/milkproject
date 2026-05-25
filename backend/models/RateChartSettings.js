const mongoose = require('mongoose');

const rateChartSettingsSchema = mongoose.Schema(
  {
    // Each center has its own rate chart. centerId is required.
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollectionCenter',
      required: true,
      unique: true,   // one rate chart per center
      index: true
    },
    baseRate:    { type: Number, required: true, default: 30 },
    fatStepInr:  { type: Number, default: 0.3 },
    snfStepInr:  { type: Number, default: 0.5 },
    fatMin:      { type: Number, default: 3.0 },
    fatMax:      { type: Number, default: 5.5 },
    snfMin:      { type: Number, default: 7.5 },
    snfMax:      { type: Number, default: 9.0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RateChartSettings', rateChartSettingsSchema);
