const mongoose = require('mongoose');

const dailyStatSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true }, // truncated to midnight, one doc per day per campaign+publisher pair
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    publisher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // the publisher's user id, matches Ad.publisher
    advertiser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // denormalized for fast advertiser chart queries
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
  },
  { timestamps: true }
);

dailyStatSchema.index({ date: 1, campaign: 1, publisher: 1 }, { unique: true });

function todayDateOnly() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

dailyStatSchema.statics.todayDateOnly = todayDateOnly;

module.exports = mongoose.model('DailyStat', dailyStatSchema);
