const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  name: { type: String, unique: true, required: true },
  detail: { type: String, required: false },
  image: { type: String, required: false, default: "" },
  isActive: { type: Boolean, default: true },

  // ====================================
  token: { type: String, required: false },
  responseType: { type: String, required: false },
  method: { type: String, required: false },
  requestURL: { type: String, required: false },
  requestId: { type: String, required: false },
  requestStatus: { type: String, required: false },
  responseMessage: { type: String, required: false },
  successValue: { type: String, required: false },
  failureValue: { type: String, required: false },
  pendingValue: { type: String, required: false },
  checkStatusURL: { type: String, required: false },
  checkStatusResponseValue: { type: String, required: false },
  // ====================================

  created: { type: Date, default: Date.now },
  updated: Date,
});

module.exports = mongoose.model("PaymentGateways", schema);
