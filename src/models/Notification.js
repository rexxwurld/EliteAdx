const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['campaign_approval', 'withdrawal_pending', 'new_user', 'flagged_ad', 'support_ticket'],
      required: true,
    },
    message: { type: String, required: true },
    severity: { type: String, enum: ['red', 'amber', 'teal'], default: 'teal' },
    read: { type: Boolean, default: false },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
