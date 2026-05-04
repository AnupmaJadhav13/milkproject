const mongoose = require('mongoose');

const rateChartSettingsSchema = mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    /** Base procurement rate at Fat 3.0 & SNF 7.5 (₹ per liter or unit — admin defines) */
    baseRate: { type: Number, required: true, default: 30 },
    fatStepInr: { type: Number, default: 0.3 },
    snfStepInr: { type: Number, default: 0.5 },
    fatMin: { type: Number, default: 3.0 },
    fatMax: { type: Number, default: 5.5 },
    snfMin: { type: Number, default: 7.5 },
    snfMax: { type: Number, default: 9.0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RateChartSettings', rateChartSettingsSchema);
