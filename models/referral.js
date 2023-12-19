const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const referralSchema = new Schema(
  {
    referralCode: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
    },
    referredBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
      },
    ],
    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
    },

    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Referral", referralSchema);
