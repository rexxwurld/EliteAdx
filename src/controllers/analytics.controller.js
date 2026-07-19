const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Ad = require('../models/Ad');
const Publisher = require('../models/Publisher');
const Payment = require('../models/Payment');
const { calculateCTR, calculatePlatformProfit, calculatePublisherEarnings } = require('../services/ctrEngine');

exports.getOverview = async (req, res, next) => {
  try {
    const { role, id } = req.user;

    if (role === 'admin') return res.json(await buildAdminOverview());
    if (role === 'advertiser') return res.json(await buildAdvertiserOverview(id));
    if (role === 'publisher') return res.json(await buildPublisherOverview(id));

    return res.status(403).json({ message: 'Unknown role' });
  } catch (err) {
    next(err);
  }
};

// Shared helper: sum confirmed/pending payments by type, optionally scoped to a user
async function sumPayments(type, status, userId) {
  const match = { type, status };
  if (userId) match.user = userId;
  const [agg] = await Payment.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return agg?.total || 0;
}

// ---------- ADMIN ----------
async function buildAdminOverview() {
  const [totalUsers, activeCampaigns, pendingApprovals, flaggedAds, suspendedUsers] = await Promise.all([
    User.countDocuments(),
    Campaign.countDocuments({ status: 'active' }),
    Campaign.countDocuments({ status: 'in_review' }),
    Ad.countDocuments({ flagged: true }),
    User.countDocuments({ status: 'suspended' }),
  ]);

  const [totals] = await Campaign.aggregate([
    { $group: { _id: null, revenue: { $sum: '$spent' }, impressions: { $sum: '$impressions' }, clicks: { $sum: '$clicks' } } },
  ]);
  const t = totals || { revenue: 0, impressions: 0, clicks: 0 };

  const topAdvertisers = await Campaign.aggregate([
    { $group: { _id: '$advertiser', spend: { $sum: '$spent' }, campaigns: { $sum: 1 } } },
    { $sort: { spend: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { name: '$user.name', spend: 1, campaigns: 1 } },
  ]);

  const topPublishers = await Publisher.find().sort({ totalEarnings: -1 }).limit(5)
    .select('siteName category totalImpressions totalEarnings');

  const recentCampaigns = await Campaign.find().sort({ createdAt: -1 }).limit(10)
    .populate('advertiser', 'name').select('title advertiser vertical status budget clicks impressions createdAt');

  const recentUsers = await User.find().sort({ createdAt: -1 }).limit(10)
    .select('name email role createdAt status');

  const [totalDeposits, totalWithdrawals, pendingWithdrawals] = await Promise.all([
    sumPayments('deposit', 'confirmed'),
    sumPayments('withdrawal', 'confirmed'),
    sumPayments('withdrawal', 'pending'),
  ]);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const [monthlyEarningsAgg] = await Payment.aggregate([
    { $match: { type: 'deposit', status: 'confirmed', createdAt: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  return {
    totalUsers,
    activeCampaigns,
    totalRevenue: t.revenue,
    totalImpressions: t.impressions,
    totalClicks: t.clicks,
    averageCTR: calculateCTR(t.clicks, t.impressions),
    moderation: { pendingApprovals, flaggedAds, suspendedUsers, supportTickets: null }, // TODO: no ticket model yet
    topAdvertisers,
    topPublishers,
    recentCampaigns,
    recentUsers,
    charts: { revenue: [], newUsers: [], impressions: [], clicks: [] }, // TODO: needs a DailyStat model — cumulative counters can't be charted over time
    financial: {
      totalDeposits,
      totalWithdrawals,
      pendingWithdrawals,
      platformProfit: calculatePlatformProfit(t.revenue), // 15% of total spend, per ctrEngine
      monthlyEarnings: monthlyEarningsAgg?.total || 0,
    },
  };
}

// ---------- ADVERTISER ----------
async function buildAdvertiserOverview(advertiserId) {
  const campaigns = await Campaign.find({ advertiser: advertiserId }).sort({ createdAt: -1 });

  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
  const totalSpend = campaigns.reduce((s, c) => s + c.spent, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);

  const topCampaigns = [...campaigns]
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5)
    .map((c) => ({ title: c.title, vertical: c.vertical, ctr: calculateCTR(c.clicks, c.impressions), spent: c.spent }));

  const recentApprovals = campaigns
    .filter((c) => c.status === 'rejected')
    .slice(0, 10)
    .map((c) => ({ title: c.title, reason: c.rejectionReason, decidedAt: c.updatedAt }));

  const [totalDeposited, totalWithdrawn, pendingDeposits] = await Promise.all([
    sumPayments('deposit', 'confirmed', advertiserId),
    sumPayments('withdrawal', 'confirmed', advertiserId),
    sumPayments('deposit', 'pending', advertiserId),
  ]);
  const walletBalance = totalDeposited - totalWithdrawn - totalSpend;

  return {
    activeCampaigns,
    totalSpend,
    totalImpressions,
    totalClicks,
    averageCTR: calculateCTR(totalClicks, totalImpressions),
    averageCPC: totalClicks ? +(totalSpend / totalClicks).toFixed(2) : 0,
    campaigns: campaigns.map((c) => ({
      id: c._id, title: c.title, status: c.status, budget: c.budget,
      spent: c.spent, clicks: c.clicks, impressions: c.impressions,
      ctr: calculateCTR(c.clicks, c.impressions),
    })),
    topCampaigns,
    recentApprovals,
    charts: { spend: [], clicks: [], impressions: [], ctr: [] }, // TODO: needs a DailyStat model
    wallet: {
      walletBalance,
      totalSpent: totalSpend,
      pendingCharges: pendingDeposits, // ASSUMPTION: standing in for a dedicated "pending charge" concept, which doesn't exist yet
      monthSpend: null, // TODO: needs a DailyStat model — Campaign.spent has no per-day breakdown
      autoReload: false, // TODO: no field for this yet — needs a User/advertiser preference field
    },
  };
}

// ---------- PUBLISHER ----------
async function buildPublisherOverview(publisherUserId) {
  const sites = await Publisher.find({ user: publisherUserId }).sort({ totalEarnings: -1 });

  const [adAgg] = await Ad.aggregate([
    { $match: { publisher: publisherUserId } },
    { $group: { _id: null, impressions: { $sum: '$impressions' }, clicks: { $sum: '$clicks' } } },
  ]);
  const agg = adAgg || { impressions: 0, clicks: 0 };

  const activeAdUnits = await Ad.countDocuments({ publisher: publisherUserId });
  const totalEarnings = sites.reduce((s, p) => s + p.totalEarnings, 0);

  const adUnits = await Ad.find({ publisher: publisherUserId })
    .populate('campaign', 'title vertical')
    .sort({ createdAt: -1 });

  const [totalWithdrawn, pendingWithdrawals] = await Promise.all([
    sumPayments('withdrawal', 'confirmed', publisherUserId),
    sumPayments('withdrawal', 'pending', publisherUserId),
  ]);
  const availableBalance = totalEarnings - totalWithdrawn;

  const lastScheduledPayout = await Payment.findOne({
    user: publisherUserId, type: 'withdrawal', status: 'pending',
  }).sort({ createdAt: -1 });

  return {
    activeAdUnits,
    totalEarnings,
    impressionsServed: agg.impressions,
    totalClicks: agg.clicks,
    averageCTR: calculateCTR(agg.clicks, agg.impressions),
    averageECPM: agg.impressions ? +((totalEarnings / agg.impressions) * 1000).toFixed(2) : 0,
    sites: sites.map((p) => ({
      id: p._id, siteName: p.siteName, siteUrl: p.siteUrl, category: p.category,
      totalImpressions: p.totalImpressions, totalEarnings: p.totalEarnings, approved: p.approved,
    })),
    adUnits: adUnits.map((a) => ({
      id: a._id, headline: a.headline, campaignTitle: a.campaign?.title,
      impressions: a.impressions, clicks: a.clicks, flagged: a.flagged,
    })),
    charts: { earnings: [], fillRate: [], impressions: [], clicks: [] }, // TODO: needs a DailyStat model
    earningsSummary: {
      totalEarned: totalEarnings,
      availableBalance,
      pendingEarnings: pendingWithdrawals, // ASSUMPTION: same caveat as advertiser pendingCharges
      monthEarnings: null, // TODO: needs a DailyStat model
      nextPayoutDate: lastScheduledPayout?.createdAt || null, // ASSUMPTION: no real "scheduled" field on Payment — using request date as placeholder
    },
  };
}