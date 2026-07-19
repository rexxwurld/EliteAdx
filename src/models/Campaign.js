const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    advertiser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vertical: {
      type: String,
      enum: ['Fintech', 'Betting', 'Mobile Apps', 'Other'],
      default: 'Other',
    },
    status: {
      type: String,
      enum: ['in_review', 'active', 'paused', 'rejected', 'completed'],
      default: 'in_review',
    },
    rejectionReason: { type: String, default: null },
    budget: { type: Number, required: true },
    spent: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    destinationUrl: { type: String, required: true, trim: true }, // advertiser's real referral link, e.g. https://sokabet.com/ref/abc123
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

campaignSchema.virtual('ctr').get(function computeCTR() {
  if (!this.impressions) return 0;
  return Number(((this.clicks / this.impressions) * 100).toFixed(2));
});

campaignSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Campaign', campaignSchema);