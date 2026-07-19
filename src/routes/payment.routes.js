const express = require('express');
const {
  initiateDeposit,
  verifyDeposit,
  requestWithdrawal,
  approveWithdrawal,
  handleWebhook,
  getPayments,
} = require('../controllers/payment.controller');
const protect = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// Public webhook — no auth, verified via Flutterwave signature instead
router.post('/webhook', express.json(), handleWebhook);

router.use(protect);

router.get('/', getPayments);
router.post('/deposit', initiateDeposit);
router.get('/verify', verifyDeposit);
router.post('/withdraw', requestWithdrawal);
router.patch('/:id/approve', roleCheck('admin'), approveWithdrawal);

module.exports = router;
