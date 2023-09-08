const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "Account" },
  customerNo: { type: String },
  operator: { type: String },
  state: { type: String },
  amount: { type: Number },
  rechargeByOperator: { type: Object },
  rechargeByApi: { type: Object },
  operatorId: { type: Schema.Types.ObjectId, ref: "Operator" },
  apiId: { type: Schema.Types.ObjectId, ref: "Apis" },
  status: {
    type: String,
    enum: ["pending", "failed", "success", "refund"],
    default: "pending",
  },
  complaintStatus: {
    type: String,
    enum: ["", "pending", "failed", "success", "refund"],
    default: "",
  },
  created: { type: Date, default: Date.now },
  rechargeData: { type: Object, default: {} },
  updated: Date,
});

module.exports = mongoose.model("Recharge", schema);
