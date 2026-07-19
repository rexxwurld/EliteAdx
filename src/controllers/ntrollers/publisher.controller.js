const Publisher = require('../models/Publisher');

// POST /api/publishers — publisher registers their own site
exports.createSite = async (req, res, next) => {
  try {
    const { siteName, siteUrl, category } = req.body;

    if (!siteName || !siteUrl) {
      return res.status(400).json({ message: 'siteName and siteUrl are required' });
    }

    const site = await Publisher.create({
      user: req.user.id,
      siteName,
      siteUrl,
      category,
      approved: false,
    });

    res.status(201).json({ site });
  } catch (err) {
    next(err);
  }
};

// GET /api/publishers — publisher sees their own sites, admin sees all
exports.listSites = async (req, res, next) => {
  try {
    const filter = req.user.role === 'publisher' ? { user: req.user.id } : {};
    const sites = await Publisher.find(filter).sort({ createdAt: -1 });
    res.json({ sites });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/publishers/:id/approve — admin only
exports.approveSite = async (req, res, next) => {
  try {
    const site = await Publisher.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    if (!site) return res.status(404).json({ message: 'Site not found' });
    res.json({ site });
  } catch (err) {
    next(err);
  }
};
