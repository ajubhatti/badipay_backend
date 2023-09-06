const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "Account" },
  upiId: { type: String, default: "" },
  orderId: { type: String, default: "" },
  clientTxnId: { type: String, default: "" },
  amount: { type: Number, required: true, default: 0 },
  upiTxnId: { type: String, default: "" },
  status: {
    type: String,
    enum: ["failed", "success"],
    default: "success",
  },
  remark: { type: Number, default: null },
  created: { type: Date, default: Date.now },
  updated: Date,
});

module.exports = mongoose.model("paymentGatewayTxn", schema);
