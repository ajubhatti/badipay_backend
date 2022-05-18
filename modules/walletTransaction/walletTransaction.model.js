const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const walletTransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "Account" },
  requestAmount: { type: Number, required: true, default: 0 },
  slipNo: { type: String },
  remark: { type: String },
  creditAccount: { type: Schema.Types.ObjectId, ref: "BankList" },

  paymentType: { type: String, default: "1" },

  debitAmount: { type: Number, default: 0 },
  creditAmount: { type: Number, default: 0 },

  amountType: {
    type: String,
    enum: ["debit", "credit"],
    default: "credit",
  },

  finalWalletAmount: { type: Number, default: 0 },

  approveBy: { type: Schema.Types.ObjectId, ref: "Account" },
  approveDate: { type: Date, default: Date.now() },
  password: { type: String },

  statusOfWalletRequest: {
    type: String,
    enum: ["pending", "cancel", "approve"],
    default: "pending",
  },

  created: { type: Date, default: Date.now },
  updated: Date,

  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
