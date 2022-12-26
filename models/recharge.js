const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "Account" },
  customerNo: { type: String },
  operator: { type: String },
  state: { type: String },
  amount: { type: Number },
  rechargeBy: { type: Object },
  rechargeByApi: { type: Object },
  status: { type: String, default: true, default: "pending" },
  created: { type: Date, default: Date.now },
  responseData: { type: Object },
  updated: Date,
});

module.exports = mongoose.model("Recharge", schema);