const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    apiName: { type: String, unique: true, required: true },
    apiDetail: { type: String, required: false },
    apiImage: { type: String, required: false, default: "" },
    isActive: { type: Boolean, default: true },

    // ====================================
    token: { type: String, required: false },
    responseType: { type: String, required: false },
    method: { type: String, required: false },
    requestURL: { type: String, required: false },
    requestId: { type: String, required: false },
    responseStatus: { type: String, required: false },
    responseTransactionId: { type: String, required: false },
    responseOperatorId: { type: String, required: false },
    responseMessage: { type: String, required: false },
    successValue: { type: String, required: false },
    failureValue: { type: String, required: false },
    pendingValue: { type: String, required: false },
    refundedValue: { type: String, required: false },
    balanceApiURL: { type: String, required: false },
    balanceResponseValue: { type: String, required: false },
    checkStatusURL: { type: String, required: false },
    checkStatusResponseValue: { type: String, required: false },
    disputeRequestURL: { type: String, required: false },
    disputeRequestResponseValue: { type: String, required: false },
    // ====================================

    created: { type: Date, default: Date.now },
    updated: Date,
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Apis", schema);
