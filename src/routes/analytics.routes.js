const express = require('express');
const {
  getOverview,
  getTimeseries,
  getTopAdvertisers,
} = require('../controllers/analytics.controller');
const protect = require('../middleware/auth');

const router = express.Router();

// getOverview branches internally by req.user.role (admin / advertiser / publisher),
// so this route just needs auth — not an admin-only roleCheck.
router.use(protect);

router.get('/overview', getOverview);
//router.get('/timeseries', getTimeseries);
//router.get('/top-advertisers', getTopAdvertisers);

module.exports = router;
