const mongoose = require('mongoose');

const publisherSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    siteName: { type: String, required: true },
    siteUrl: { type: String, required: true },
    category: { type: String, default: 'General' },
    totalImpressions: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Publisher', publisherSchema);
