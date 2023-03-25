const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  requestAmount: { type: Number, required: false, default: 0 },
  rechargeAmount: { type: Number, required: false, default: 0 },
  cashBackReceive: { type: Number, required: false, default: 0 },
  userCashBack: { type: Number, required: false, default: 0 },
  referralCashBack: { type: Number, required: false, default: 0 },
  netCashBack: { type: Number, required: false, default: 0 },
  created: { type: Date, default: Date.now },
  updated: Date,
});

module.exports = mongoose.model("adminloyalty", schema);
