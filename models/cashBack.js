const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    rechargeId: {
      type: Schema.Types.ObjectId,
      ref: "Recharge",
    },
    userId: { type: Schema.Types.ObjectId, ref: "Account" },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    requestAmount: { type: Number, default: 0 },
    rechargeAmount: { type: Number, default: 0 },
    cashBackReceive: { type: Number, default: 0 },
    userCashBack: { type: Number, default: 0 },
    referralCashBack: { type: Number, default: 0 },
    netCashBack: { type: Number, default: 0 },

    finalAmount: { type: Number, default: 0 },

    // ===========================================
    requestAmountBckup: { type: Number, default: 0 },
    rechargeAmountBckup: { type: Number, default: 0 },
    cashBackReceiveBckup: { type: Number, default: 0 },
    userCashBackBckup: { type: Number, default: 0 },
    referralCashBackBckup: { type: Number, default: 0 },
    netCashBackBckup: { type: Number, default: 0 },
    finalAmountBackup: { type: Number, default: 0 },

    operatorId: { type: Schema.Types.ObjectId, ref: "Operator" },
    apiId: { type: Schema.Types.ObjectId, ref: "Apis" },

    status: {
      type: String,
      enum: ["pending", "failed", "success", "refund"],
      default: "pending",
    },

    created: { type: Date, default: Date.now },
    updated: Date,
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Cashback", schema);
