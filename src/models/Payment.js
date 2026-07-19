const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    method: { type: String, default: 'flutterwave' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending',
    },
    accountBank: { type: String, default: null },     // added — bank code for withdrawal payouts
    accountNumber: { type: String, default: null },    // added — account number for withdrawal payouts
    flwRef: { type: String },
    flwTransactionId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
