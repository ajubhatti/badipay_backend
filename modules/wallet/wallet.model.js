const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const walletSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "Account" },
  requestAmount: { type: Number, required: true, default: 0 },
  slipNo: { type: String },
  remark: { type: String },

  paymentType: { type: String, required: true, default: "1" },
  bank: { type: Schema.Types.ObjectId, ref: "BankList" },

  referenceNo: { type: String },
  depositBank: { type: Schema.Types.ObjectId, ref: "BankList" },
  depositBranch: { type: String },

  amount: { type: Number, default: 0 },

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

module.exports = mongoose.model("UserWallet", walletSchema);
