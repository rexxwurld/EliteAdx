const Campaign = require('../models/Campaign');
const Ad = require('../models/Ad');
const User = require('../models/User');

exports.getPendingCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({ status: 'in_review' })
      .populate('advertiser', 'name email')
      .sort('-createdAt');
    res.json(campaigns);
  } catch (err) {
    next(err);
  }
};

exports.approveCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    next(err);
  }
};

exports.rejectCampaign = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    next(err);
  }
};

exports.getFlaggedAds = async (req, res, next) => {
  try {
    const ads = await Ad.find({ flagged: true }).populate('campaign publisher');
    res.json(ads);
  } catch (err) {
    next(err);
  }
};

exports.flagAd = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const ad = await Ad.findByIdAndUpdate(
      req.params.id,
      { flagged: true, flagReason: reason },
      { new: true }
    );
    if (!ad) return res.status(404).json({ message: 'Ad not found' });
    res.json(ad);
  } catch (err) {
    next(err);
  }
};

exports.getSuspendedUsers = async (req, res, next) => {
  try {
    const users = await User.find({ status: 'suspended' });
    res.json(users);
  } catch (err) {
    next(err);
  }
};
