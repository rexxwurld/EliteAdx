const axios = require('axios');

const FLW_BASE_URL = 'https://api.flutterwave.com/v3';

const flwClient = axios.create({
  baseURL: FLW_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Initialize a deposit (advertiser/publisher funding their wallet).
 * Docs: https://developer.flutterwave.com/docs/collecting-payments/standard
 */
async function initializeDeposit({ amount, email, name, txRef }) {
  const payload = {
    tx_ref: txRef,
    amount,
    currency: 'NGN',
    redirect_url: `${process.env.CLIENT_URL}/api/payments/verify`,
    customer: { email, name },
    customizations: {
      title: 'EliteAdx Wallet Funding',
      description: 'Fund your EliteAdx advertiser/publisher wallet',
    },
  };

  const { data } = await flwClient.post('/payments', payload);
  return data; // data.data.link -> redirect the user here to complete payment
}

/**
 * Verify a transaction after Flutterwave redirects back / sends a webhook.
 */
async function verifyTransaction(transactionId) {
  const { data } = await flwClient.get(`/transactions/${transactionId}/verify`);
  return data;
}

/**
 * Initiate a withdrawal (payout) to a user's bank account.
 * Docs: https://developer.flutterwave.com/docs/transfers
 */
async function initiateTransfer({ accountBank, accountNumber, amount, narration, reference }) {
  const payload = {
    account_bank: accountBank, // e.g. "044" for Access Bank
    account_number: accountNumber,
    amount,
    narration,
    currency: 'NGN',
    reference,
  };

  const { data } = await flwClient.post('/transfers', payload);
  return data;
}

/**
 * Verify the webhook signature Flutterwave sends on payment/transfer events.
 * Compare req.headers['verif-hash'] against your FLW_WEBHOOK_HASH.
 */
function isValidWebhookSignature(signatureHeader) {
  return signatureHeader === process.env.FLW_WEBHOOK_HASH;
}

module.exports = {
  initializeDeposit,
  verifyTransaction,
  initiateTransfer,
  isValidWebhookSignature,
};
