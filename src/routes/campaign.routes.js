const express = require('express');
const {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaignStatus,
  deleteCampaign,
} = require('../controllers/campaign.controller');
const protect = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);

router.post('/', roleCheck('advertiser', 'admin'), createCampaign);
router.get('/', getCampaigns);
router.get('/:id', getCampaignById);
router.patch('/:id/status', roleCheck('admin'), updateCampaignStatus);
router.delete('/:id', roleCheck('admin'), deleteCampaign);

module.exports = router;
