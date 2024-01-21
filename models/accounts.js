const { string } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
    userName: { type: String, required: true },
    phoneNumber: { type: String, unique: true, required: true },
    email: { type: String, trim: true, unique: true, required: true },
    passwordHash: { type: String, required: true },
    pswdString: { type: String },
    passwordResetDate: { type: Date, default: Date.now },
    verificationToken: { type: String },
    verifiedDate: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    resetToken: { token: String, expires: Date },
    isFirstLogin: { type: Boolean, default: true },
    stateId: { type: mongoose.Schema.Types.ObjectId, ref: "State" },
    city: { type: String },
    pincode: { type: Number },
    transPin: { type: String },
    transactionPin: { type: String, required: false },
    hasTransactionPin: { type: Boolean, default: false },
    transactionPinResetDate: { type: Date, default: Date.now },

    location: { type: String, default: "" },
    otp: { type: Number },
    otpDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: false },
    isLogin: { type: Boolean, default: false },

    walletBalance: { type: Number, default: 0 },
    walletId: { type: mongoose.Schema.Types.ObjectId, ref: "wallet" },
    pendingBalance: { type: Number, default: 0 },
    rewardedBalance: { type: Number, default: 0 }, // cashback
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },

    isFromAdmin: { type: Boolean, default: false },
    referralId: { type: mongoose.Schema.Types.ObjectId, ref: "Referral" },
    lastDiscount: { type: Number, default: 0 }
  },{
    timestamps: true, versionKey: false
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

module.exports = mongoose.model("Account", schema);
