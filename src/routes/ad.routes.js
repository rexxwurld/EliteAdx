const express = require('express');
const protect = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { trackClick, trackImpression, createAd, listAds } = require('../controllers/ad.controller');

const router = express.Router();

// Public tracking endpoints — no auth. These are hit by end users on the publisher's site, not logged-in platform users.
router.get('/:id/click', trackClick);
router.get('/:id/impression', trackImpression);

// Platform-authenticated endpoints
router.get('/', protect, listAds);
router.post('/', protect, roleCheck('admin'), createAd);

module.exports = router;