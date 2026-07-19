const crypto = require('crypto');
const Payment = require('../models/Payment');
const User = require('../models/User');
const flw = require('../services/flutterwave.service');
const { notify } = require('../services/notifier');

// POST /api/payments/deposit — start a deposit
exports.initiateDeposit = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const txRef = `EAX-${crypto.randomUUID()}`;

    const payment = await Payment.create({
      user: req.user._id,
      type: 'deposit',
      amount,
      flwRef: txRef,
      status: 'pending',
    });

    const flwResponse = await flw.initializeDeposit({
      amount,
      email: req.user.email,
      name: req.user.name,
      txRef,
    });

    res.status(201).json({
      payment,
      paymentLink: flwResponse.data.link,
    });
  } catch (err) {
    next(err);
  }
};

// Shared, idempotent confirm — used by BOTH the redirect callback and the webhook,
// so whichever one fires first wins and the second is a safe no-op.
async function confirmDeposit(txRef, transactionId) {
  const payment = await Payment.findOne({ flwRef: txRef });
  if (!payment) return null;
  if (payment.status === 'confirmed') return payment; // already handled — prevents double-crediting wallet

  payment.status = 'confirmed';
  payment.flwTransactionId = transactionId;
  await payment.save();

  await User.findByIdAndUpdate(payment.user, { $inc: { walletBalance: payment.amount } });
  return payment;
}

// GET /api/payments/verify?transaction_id=... — Flutterwave redirect callback
exports.verifyDeposit = async (req, res, next) => {
  try {
    const { transaction_id: transactionId } = req.query;
    const result = await flw.verifyTransaction(transactionId);

    if (result.data.status !== 'successful') {
      return res.status(400).json({ message: 'Transaction not successful' });
    }

    const payment = await confirmDeposit(result.data.tx_ref, transactionId);
    res.json({ message: 'Deposit confirmed', payment });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/withdraw — request a withdrawal
exports.requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, accountBank, accountNumber } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }
    if (!accountBank || !accountNumber) {
      return res.status(400).json({ message: 'accountBank and accountNumber are required' });
    }
    if (req.user.walletBalance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    const payment = await Payment.create({
      user: req.user._id,
      type: 'withdrawal',
      amount,
      accountBank,
      accountNumber,
      status: 'pending',
    });

    await notify({
      type: 'withdrawal_pending',
      message: `${req.user.name} requested a withdrawal of ₦${amount}`,
      severity: 'amber',
      relatedId: payment._id,
    });

    res.status(201).json({ message: 'Withdrawal requested, pending admin approval', payment });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/payments/:id/approve — admin approves a withdrawal, triggers real payout
exports.approveWithdrawal = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment || payment.type !== 'withdrawal') {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }
    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal already processed' });
    }
    if (!payment.accountBank || !payment.accountNumber) {
      return res.status(400).json({ message: 'Withdrawal has no bank details on file — cannot process' });
    }

    // Use the stored request, never req.body — the admin approves what was
    // actually asked for, they don't get to redirect funds elsewhere.
    const reference = `EAX-PAYOUT-${crypto.randomUUID()}`;

    await flw.initiateTransfer({
      accountBank: payment.accountBank,
      accountNumber: payment.accountNumber,
      amount: payment.amount,
      narration: 'EliteAdx withdrawal',
      reference,
    });

    payment.status = 'confirmed';
    payment.flwRef = reference;
    await payment.save();

    await User.findByIdAndUpdate(payment.user, { $inc: { walletBalance: -payment.amount } });

    await notify({
      type: 'withdrawal_approved',
      message: `Withdrawal of ₦${payment.amount} approved and payout initiated`,
      severity: 'teal',
      relatedId: payment._id,
    });

    res.json({ message: 'Withdrawal approved and payout initiated', payment });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/webhook — Flutterwave server-to-server events
exports.handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['verif-hash'];
    if (!flw.isValidWebhookSignature(signature)) {
      return res.status(401).json({ message: 'Invalid webhook signature' });
    }

    const event = req.body;

    if (event.event === 'charge.completed' && event.data?.status === 'successful') {
      await confirmDeposit(event.data.tx_ref, event.data.id);
    }

    if (event.event === 'transfer.completed') {
      const payment = await Payment.findOne({ flwRef: event.data.reference });
      if (payment && payment.status === 'pending') {
        // A transfer webhook confirming a payout that's still "pending" on our side
        // means approveWithdrawal's own confirm didn't fire correctly — mark it now
        // so the record doesn't get stuck.
        payment.status = event.data.status === 'SUCCESSFUL' ? 'confirmed' : 'failed';
        await payment.save();
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
};

exports.getPayments = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    const payments = await Payment.find(filter).populate('user', 'name email').sort('-createdAt');
    res.json(payments);
  } catch (err) {
    next(err);
  }
};