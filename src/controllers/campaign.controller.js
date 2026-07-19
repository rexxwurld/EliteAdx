const Campaign = require('../models/Campaign');
const { notify } = require('../services/notifier');

exports.createCampaign = async (req, res, next) => {
  try {
    const { title, vertical, budget, startDate, endDate } = req.body;

    const campaign = await Campaign.create({
      title,
      vertical,
      budget,
      startDate,
      endDate,
      advertiser: req.user._id,
    });

    await notify({
      type: 'campaign_approval',
      message: `New campaign "${campaign.title}" submitted for review`,
      severity: 'red',
      relatedId: campaign._id,
    });

    res.status(201).json(campaign);
  } catch (err) {
    next(err);
  }
};

exports.getCampaigns = async (req, res, next) => {
  try {
    const filter = req.user.role === 'advertiser' ? { advertiser: req.user._id } : {};
    const campaigns = await Campaign.find(filter)
      .populate('advertiser', 'name email')
      .sort('-createdAt');
    res.json(campaigns);
  } catch (err) {
    next(err);
  }
};

exports.getCampaignById = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('advertiser', 'name email');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    next(err);
  }
};

exports.updateCampaignStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body; // status: active | paused | rejected | completed
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status, rejectionReason: status === 'rejected' ? rejectionReason : null },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    next(err);
  }
};

exports.deleteCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json({ message: 'Campaign deleted' });
  } catch (err) {
    next(err);
  }
};
