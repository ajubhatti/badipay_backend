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

    rechargeId: { type: Schema.Types.ObjectId, ref: "Recharge" },
    operatorId: { type: Schema.Types.ObjectId, ref: "Operator" },
    serviceId: { type: Schema.Types.ObjectId, ref: "Services" },
    apiId: { type: Schema.Types.ObjectId, ref: "Apis" },

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
    totalAmount: { type: Number, default: 0 },
    // ===========================================

    operatorName: { type: String, default: "" },
    userBalance: { type: Number, default: 0 },
    requestAmount: { type: Number, default: 0 },
    cashBackAmount: { type: Number, default: 0 },
    rechargeAmount: { type: Number, default: 0 },
    userFinalBalance: { type: Number, default: 0 },

    requestAmountBack: { type: Number, default: 0 },
    cashBackAmountBack: { type: Number, default: 0 },
    rechargeAmountBack: { type: Number, default: 0 },
    // ===========================================

    isPendingOrFail: { type: Boolean, default: false },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Transaction", transactionSchema);
