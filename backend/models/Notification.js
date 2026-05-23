const mongoose = require('mongoose');

/**
 * Notification — in-app notification system replacing SMS.
 * Stores all notifications per farmer with read/unread status.
 */
const notificationSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: [
        'FARMER_REGISTRATION',
        'PAYMENT_DONE',
        'ADVANCE_GIVEN',
        'ANNUAL_BONUS',
        'FOOD_RECORD',
        'MILK_COLLECTION',
        'CUSTOM_MESSAGE'
      ]
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

// Compound indexes for efficient farmer-wise queries
notificationSchema.index({ farmerId: 1, createdAt: -1 });
notificationSchema.index({ farmerId: 1, isRead: 1 });
notificationSchema.index({ farmerId: 1, type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
