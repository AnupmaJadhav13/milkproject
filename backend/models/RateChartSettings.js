const mongoose = require('mongoose');

const stepRangeSchema = mongoose.Schema({
  fromValue: { type: Number, required: true },  // Starting point for this rate
  stepRate:  { type: Number, required: true }   // Rate per 0.1 increment
}, { _id: false });

// Animal-specific rate configuration
const animalRateSchema = mongoose.Schema({
  baseRate: { type: Number, required: true, default: 30 },
  fatSteps: {
    type: [stepRangeSchema],
    default: function() {
      return [{ fromValue: 3.0, stepRate: 0.3 }];
    }
  },
  snfSteps: {
    type: [stepRangeSchema],
    default: function() {
      return [{ fromValue: 7.5, stepRate: 0.5 }];
    }
  },
  fatMin: { type: Number, required: true },
  fatMax: { type: Number, required: true },
  snfMin: { type: Number, required: true },
  snfMax: { type: Number, required: true }
}, { _id: false });

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
    
    // Separate rate charts for Cow and Buffalo
    cow: {
      type: animalRateSchema,
      default: function() {
        return {
          baseRate: 30,
          fatSteps: [{ fromValue: 3.0, stepRate: 0.3 }],
          snfSteps: [{ fromValue: 7.5, stepRate: 0.5 }],
          fatMin: 3.0,
          fatMax: 5.5,
          snfMin: 7.5,
          snfMax: 9.0
        };
      }
    },
    
    buffalo: {
      type: animalRateSchema,
      default: function() {
        return {
          baseRate: 35,
          fatSteps: [{ fromValue: 5.0, stepRate: 0.5 }],
          snfSteps: [{ fromValue: 8.0, stepRate: 0.6 }],
          fatMin: 5.0,
          fatMax: 7.0,
          snfMin: 8.0,
          snfMax: 9.5
        };
      }
    },
    
    // Keep old fields for backward compatibility (deprecated)
    baseRate:    { type: Number },
    fatSteps:    { type: [stepRangeSchema] },
    snfSteps:    { type: [stepRangeSchema] },
    fatStepInr:  { type: Number },
    snfStepInr:  { type: Number },
    fatMin:      { type: Number },
    fatMax:      { type: Number },
    snfMin:      { type: Number },
    snfMax:      { type: Number }
  },
  { timestamps: true }
);

// Pre-save hook to migrate old format to new format
rateChartSettingsSchema.pre('save', function(next) {
  // Only run migration if this is a NEW document or if old format exists but new format is completely missing
  if (this.isNew) {
    // For new documents, ensure both cow and buffalo have defaults if not provided
    if (!this.cow || Object.keys(this.cow).length === 0) {
      this.cow = {
        baseRate: 30,
        fatSteps: [{ fromValue: 3.0, stepRate: 0.3 }],
        snfSteps: [{ fromValue: 7.5, stepRate: 0.5 }],
        fatMin: 3.0,
        fatMax: 5.5,
        snfMin: 7.5,
        snfMax: 9.0
      };
    }
    
    if (!this.buffalo || Object.keys(this.buffalo).length === 0) {
      this.buffalo = {
        baseRate: 35,
        fatSteps: [{ fromValue: 5.0, stepRate: 0.5 }],
        snfSteps: [{ fromValue: 8.0, stepRate: 0.6 }],
        fatMin: 5.0,
        fatMax: 7.0,
        snfMin: 8.0,
        snfMax: 9.5
      };
    }
  }
  
  next();
});

module.exports = mongoose.model('RateChartSettings', rateChartSettingsSchema);
