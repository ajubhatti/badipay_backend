const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Account" },
    customerNo: { type: String },
    operator: { type: String },
    state: { type: String },
    amount: { type: Number, default: 0 },
    operatorId: { type: Schema.Types.ObjectId, ref: "Operator" },
    serviceCategoryId: { type: Schema.Types.ObjectId, ref: "ServiceCategory" },
    serviceId: { type: Schema.Types.ObjectId, ref: "Services" },
    apiId: { type: Schema.Types.ObjectId, ref: "Apis" },
    status: {
      type: String,
      enum: ["pending", "failed", "success", "refund"],
      default: "pending",
    },
    complaintStatus: {
      type: String,
      enum: [
        "notinitialize",
        "initialize",
        "pending",
        "failed",
        "success",
        "refund",
      ],
      default: "notinitialize",
    },
    rechargeData: { type: Object, default: {} },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Recharge", schema);
