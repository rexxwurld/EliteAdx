const Ad = require('../models/Ad');
const DailyStat = require('../models/DailyStat');
const Campaign = require('../models/Campaign');
const Publisher = require('../models/Publisher');

// GET /api/ads/:id/click — public, no auth (this is hit directly by end users on the publisher's site)
exports.trackClick = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id).populate('campaign');
    if (!ad || !ad.campaign) return res.status(404).send('Ad not found');

    ad.clicks += 1;
    await ad.save();

    ad.campaign.clicks += 1;
    await ad.campaign.save();

    await DailyStat.findOneAndUpdate(
      { date: DailyStat.todayDateOnly(), campaign: ad.campaign._id, publisher: ad.publisher || null },
      { $inc: { clicks: 1 }, $set: { advertiser: ad.campaign.advertiser } },
      { upsert: true }
    );

    return res.redirect(302, ad.campaign.destinationUrl);
  } catch (err) {
    console.error('trackClick error:', err);
    return res.status(500).send('Something went wrong');
  }
};

// GET /api/ads/:id/impression — public, no auth (1x1 pixel hit from the publisher's page)
const TRANSPARENT_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7',
  'base64'
);

exports.trackImpression = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id).populate('campaign');
    if (ad && ad.campaign) {
      ad.impressions += 1;
      await ad.save();

      ad.campaign.impressions += 1;
      await ad.campaign.save();

      await DailyStat.findOneAndUpdate(
        { date: DailyStat.todayDateOnly(), campaign: ad.campaign._id, publisher: ad.publisher || null },
        { $inc: { impressions: 1 }, $set: { advertiser: ad.campaign.advertiser } },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error('trackImpression error:', err);
    // fall through — always return the pixel even if logging failed, so the publisher's page doesn't break
  }
  res.set('Content-Type', 'image/gif');
  res.send(TRANSPARENT_PIXEL);
};

// POST /api/ads — admin only (assigns a campaign to a publisher's site; manual matching for now)
exports.createAd = async (req, res, next) => {
  try {
    const { campaign, publisher, headline, creativeUrl } = req.body;

    const campaignDoc = await Campaign.findById(campaign);
    if (!campaignDoc) return res.status(404).json({ message: 'Campaign not found' });
    if (campaignDoc.status !== 'active') {
      return res.status(400).json({ message: 'Campaign must be active before it can be assigned to a publisher' });
    }

    const ad = await Ad.create({ campaign, publisher, headline, creativeUrl });
    res.status(201).json({ ad });
  } catch (err) {
    next(err);
  }
};

// GET /api/ads — publisher sees their own, admin sees all
exports.listAds = async (req, res, next) => {
  try {
    const filter = req.user.role === 'publisher' ? { publisher: req.user.id } : {};
    const ads = await Ad.find(filter).populate('campaign', 'title vertical destinationUrl status');
    res.json({ ads });
  } catch (err) {
    next(err);
  }
};