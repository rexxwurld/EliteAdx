const express = require('express');
const protect = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { createSite, listSites, approveSite } = require('../controllers/publisher.controller');

const router = express.Router();

router.get('/', protect, listSites);
router.post('/', protect, roleCheck('publisher'), createSite);
router.patch('/:id/approve', protect, roleCheck('admin'), approveSite);

module.exports = router;