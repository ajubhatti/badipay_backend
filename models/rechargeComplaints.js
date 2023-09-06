const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    rechargeId: { type: Schema.Types.ObjectId, ref: "Recharge" },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    status: {
      type: String,
      enum: ["pending", "failed", "success", "refund"],
      default: "pending",
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("RechargeComplaints", schema);
