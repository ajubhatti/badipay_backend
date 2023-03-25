const { string } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "State" },
  city: { type: String },
  pincode: { type: Number },

  transactionPin: { type: String, required: false },
  hasTransactionPin: { type: Boolean, default: false },
  transactionPinResetDate: Date,

  location: { type: String, default: "" },
  otp: { type: Number },
  otpDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  isLogin: { type: Boolean, default: true },

  walletBalance: { type: Number, default: 0 },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: "wallet" },
  pendingBalance: { type: Number, default: 0 },
  rewardedBalance: { type: Number, default: 0 }, // cashback
  role: { type: String, enum: ["user", "moderator", "admin"], default: "user" },

  isFromAdmin: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  referralId: { type: mongoose.Schema.Types.ObjectId, ref: "Referral" },
  updatedAt: Date,
});

module.exports = mongoose.model("AccountFinance", schema);
