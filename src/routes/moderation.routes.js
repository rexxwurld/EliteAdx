const express = require('express');
const {
  getPendingCampaigns,
  approveCampaign,
  rejectCampaign,
  getFlaggedAds,
  flagAd,
  getSuspendedUsers,
} = require('../controllers/moderation.controller');
const protect = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect, roleCheck('admin'));

router.get('/campaigns/pending', getPendingCampaigns);
router.patch('/campaigns/:id/approve', approveCampaign);
router.patch('/campaigns/:id/reject', rejectCampaign);

router.get('/ads/flagged', getFlaggedAds);
router.patch('/ads/:id/flag', flagAd);

router.get('/users/suspended', getSuspendedUsers);

module.exports = router;
