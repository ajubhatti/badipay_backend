const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const walletTransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "Account" },
  requestAmount: { type: Number, required: true, default: 0 },
  slipNo: { type: String },
  remark: { type: String },
  creditAccount: { type: Schema.Types.ObjectId, ref: "BankList" },

  transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },

  paymentType: { type: String, default: "1" },

  // debitAmount: { type: Number, default: 0 },
  // creditAmount: { type: Number, default: 0 },

  amountType: {
    type: String,
    enum: ["debit", "credit"],
    default: "credit",
  },

  finalWalletAmount: { type: Number, default: 0 },

  approveBy: { type: Schema.Types.ObjectId, ref: "Account" },
  approveDate: { type: Date, default: Date.now() },
  password: { type: String },
  isActive: { type: Boolean, default: true },

  statusOfWalletRequest: {
    type: String,
    enum: ["pending", "cancel", "approve"],
    default: "pending",
  },
  created: { type: Date, default: Date.now },
  updated: Date,
});

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
