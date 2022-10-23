const { string } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  userName: { type: String, unique: true, required: true },
  phoneNumber: { type: String, unique: true, required: true },
  email: { type: String, trim: true, unique: true, required: true },
  passwordHash: { type: String, required: true },
  acceptTerms: { type: Boolean },
  verificationToken: String,
  verified: Date,
  isVerified: { type: Boolean, default: false },
  resetToken: { token: String, expires: Date },
  isFirstLogin: { type: Boolean, default: true },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: "state" },
  city: { type: String },
  pincode: { type: Number },
  passwordReset: Date,

  transactionPin: { type: String, required: false },
  hasTransactionPin: { type: Boolean, required: false },

  location: { type: String, default: "" },
  otp: { type: Number },
  otpDate: { type: Date, default: Date.now },
  otpUpdateDate: { type: Date },
  isActive: { type: Boolean, default: true },

  referralCode: { type: String, required: false },
  referralId: { type: mongoose.Schema.Types.ObjectId, ref: "referral" },

  walletBalance: { type: Number, default: 0 },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: "wallet" },
  // role: { type: String, required: true },
  role: { type: String, enum: ["user", "moderator", "admin"], default: "user" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

// schema.virtual("isVerified").get(() => {
//   return !!(this.verified || this.passwordReset);
// });

schema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    // remove these props when object is serialized
    delete ret._id;
    delete ret.passwordHash;
  },
});

module.exports = mongoose.model("Account", schema);
