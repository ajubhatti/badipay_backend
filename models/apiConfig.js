const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    apiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Apis",
      required: true,
    },
    apiName: { type: String, required: false, default: "" },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    // ====================================
    responseType: { type: String, required: false, default: "" },
    method: { type: String, required: false, default: "" },
    requestURL: { type: String, required: false, default: "" },
    requestId: { type: String, required: false, default: "" },
    responseStatus: { type: String, required: false, default: "" },
    responseTransactionId: { type: String, required: false, default: "" },
    responseOperatorId: { type: String, required: false, default: "" },
    responseMessage: { type: String, required: false, default: "" },
    successValue: { type: String, required: false, default: "" },
    failureValue: { type: String, required: false, default: "" },
    pendingValue: { type: String, required: false, default: "" },
    refundedValue: { type: String, required: false, default: "" },
    balanceApiURL: { type: String, required: false, default: "" },
    balanceResponseValue: { type: String, required: false, default: "" },
    checkStatusURL: { type: String, required: false, default: "" },
    checkStatusResponseValue: { type: String, required: false, default: "" },
    disputeRequestURL: { type: String, required: false, default: "" },
    disputeRequestResponseValue: { type: String, required: false, default: "" },
    // ====================================
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("ApiConfig", schema);
