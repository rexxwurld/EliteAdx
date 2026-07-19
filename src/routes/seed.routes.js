const express = require('express');
const User = require('../models/User');

const router = express.Router();

// GET /api/seed-users?key=YOUR_SECRET
// Temporary, one-time use — delete this file after running.
router.get('/seed-users', async (req, res) => {
  try {
    if (req.query.key !== process.env.SEED_SECRET) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const usersToCreate = [
      { name: 'Your Name', email: 'admin@eliteadx.com', password: 'AdminPass123!', role: 'admin' },
      { name: 'SokaBet', email: 'advertiser@eliteadx.com', password: 'AdvertiserPass123!', role: 'advertiser' },
      { name: 'PredictionSite', email: 'publisher@eliteadx.com', password: 'PublisherPass123!', role: 'publisher' },
    ];

    const results = [];
    for (const userData of usersToCreate) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        results.push(`Skipped (exists): ${userData.email}`);
        continue;
      }
      const user = await User.create(userData);
      results.push(`Created: ${user.email} — ${user.role}`);
    }

    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
