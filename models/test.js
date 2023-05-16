const { string } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  userName: { type: String, unique: true, required: true },
  phoneNumber: { type: String, unique: true, required: true },
  email: { type: String, trim: true, unique: true, required: true },
  passwordHash: { type: String, required: true },
  passwordEncrpt: { type: Object },
  passwordResetDate: Date,
  verificationToken: String,
  verifiedDate: Date,
  isVerified: { type: Boolean, default: false },
  resetToken: { token: String, expires: Date },
  isFirstLogin: { type: Boolean, default: true },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: "State" },
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

  referralId: { type: mongoose.Schema.Types.ObjectId, ref: "Referral" },
  lastDiscount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

schema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    // remove these props when object is serialized
    delete ret._id;
    delete ret.passwordHash;
  },
});

module.exports = mongoose.model("Test", schema);
