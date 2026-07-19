const mongoose = require('mongoose');

const adSchema = new mongoose.Schema(
  {
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    publisher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    creativeUrl: { type: String },
    headline: { type: String },
    flagged: { type: Boolean, default: false },
    flagReason: { type: String, default: null },
    clicks: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ad', adSchema);
