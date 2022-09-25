const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "Account" },
  customerNo: { type: String },
  operator: { type: String },
  state: { type: String },
  amount: { type: Number },
  rechargeBy: { type: String, required: false },
  status: { type: Boolean, default: true },
  created: { type: Date, default: Date.now },
  updated: Date,
});

module.exports = mongoose.model("Recharge", schema);
