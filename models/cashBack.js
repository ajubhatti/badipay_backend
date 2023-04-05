const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  rechargeId: { type: Schema.Types.ObjectId, ref: "Recharge", required: false },
  userId: { type: Schema.Types.ObjectId, ref: "Account", required: false },
  transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
  requestAmount: { type: Number, required: false },
  rechargeAmount: { type: Number, required: false },
  cashBackReceive: { type: Number, required: false },
  userCashBack: { type: Number, required: false },
  referralCashBack: { type: Number, required: false },
  netCashBack: { type: Number, required: false },

  // ===========================================
  requestAmountBckup: { type: Number, required: false },
  rechargeAmountBckup: { type: Number, required: false },
  cashBackReceiveBckup: { type: Number, required: false },
  userCashBackBckup: { type: Number, required: false },
  referralCashBackBckup: { type: Number, required: false },
  netCashBackBckup: { type: Number, required: false },

  created: { type: Date, default: Date.now },
  updated: Date,
});

module.exports = mongoose.model("Cashback", schema);