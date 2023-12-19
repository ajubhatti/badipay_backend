const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Account" },
    customerNo: { type: String, default: "" },
    transactionId: { type: String, default: "" },
    amount: { type: Number, required: true, default: 0 },
    slipNo: { type: String, default: "" },
    remark: { type: String, default: "" },
    description: { type: Object, default: {} },
    operatorId: { type: String, default: "" },
    apiProvider: { type: String, default: "" },
    serviceType: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "failed", "success", "refund"],
      default: "pending",
    },
    rechargeData: { type: Object, default: {} },
    type: {
      type: String,
      enum: ["debit", "credit"],
      default: "credit",
    },
    totalAmount: { type: Number, default: null },
    // ===========================================
    rechargeId: { type: Schema.Types.ObjectId, ref: "Recharge" },

    operatorName: { type: String, default: "" },
    userBalance: { type: Number, default: null },
    requestAmount: { type: Number, default: null },
    cashBackAmount: { type: Number, default: null },
    rechargeAmount: { type: Number, default: null },
    userFinalBalance: { type: Number, default: null },

    requestAmountBack: { type: Number, default: null },
    cashBackAmountBack: { type: Number, default: null },
    rechargeAmountBack: { type: Number, default: null },
    // ===========================================

    isPendingOrFail: { type: Boolean, default: false },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Transaction", transactionSchema);
