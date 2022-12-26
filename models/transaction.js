const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "Account" },
  transactionId: { type: String },
  amount: { type: Number, required: true, default: 0 },
  slipNo: { type: String },
  remark: { type: String },
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
  totalAmount: { type: Number, required: true, default: 0 },
  // ===========================================
  customerNo: { type: String },
  operatorId: { type: Schema.Types.ObjectId, ref: "company" },
  operatorName: { type: String },
  userBalance: { tye: Number },
  requestAmount: { tye: Number },
  cashBackAmount: { tye: Number },
  rechargeAmount: { tye: Number },
  userFinalBalance: { tye: Number },

  // ===========================================

  created: { type: Date, default: Date.now },
  updated: Date,
});

module.exports = mongoose.model("Transaction", transactionSchema);
