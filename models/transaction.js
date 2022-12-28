const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "Account" },
  transactionId: { type: String, default: "" },
  amount: { type: Number, required: true, default: 0 },
  slipNo: { type: String, default: "" },
  remark: { type: String, default: "" },
  description: { type: Object, default: {} },
  type: {
    type: String,
    enum: ["debit", "credit"],
    default: "credit",
  },
  status: {
    type: String,
    enum: ["pending", "cancel", "approve", "refund"],
    default: "pending",
  },
  totalAmount: { type: Number, default: null },
  // ===========================================
  customerNo: { type: String, default: "" },
  operatorId: { type: Schema.Types.ObjectId, ref: "company" },
  operatorName: { type: String, default: "" },
  userBalance: { type: Number, default: null },
  requestAmount: { type: Number, default: null },
  cashBackAmount: { type: Number, default: null },
  rechargeAmount: { type: Number, default: null },
  userFinalBalance: { type: Number, default: null },

  // ===========================================

  created: { type: Date, default: Date.now },
  updated: Date,
});

module.exports = mongoose.model("Transaction", transactionSchema);
