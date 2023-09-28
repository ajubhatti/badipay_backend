const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    apiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Apis",
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Services",
      required: true,
    },
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Operator",
      required: true,
    },
    operatorConfigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OperatorConfig",
      required: true,
    },
    userDiscount: { type: Number, default: 0 },
    userDiscountType: {
      type: String,
      enum: ["number", "percentage"],
      default: "number",
    },
    userDiscountLimit: { type: Number, default: 1 },

    referalDiscount: { type: Number, default: 0 },
    referalDiscountType: {
      type: String,
      enum: ["number", "percentage"],
      default: "number",
    },
    referalDiscountLimit: { type: Number, default: 1 },

    adminDiscount: { type: Number, default: 0 },
    adminDiscountType: {
      type: String,
      enum: ["number", "percentage"],
      default: "number",
    },

    created: { type: Date, default: Date.now },
    updated: Date,
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("ServiceDiscount", schema);
