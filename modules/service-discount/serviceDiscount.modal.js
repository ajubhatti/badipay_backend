const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  apiId: { type: mongoose.Schema.Types.ObjectId, ref: "Apis", required: true },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Services",
    required: true,
  },
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "company",
    required: true,
  },
  amount: { type: Number, default: 0 },
  type: {
    type: String,
    enum: ["number", "percentage"],
    default: "number",
  },
  discountLimit: { type: Number, default: -1 },

  referalAmount: { type: Number, default: 0 },
  referalType: {
    type: String,
    enum: ["number", "percentage"],
    default: "number",
  },
  referalDiscountLimit: { type: Number, default: -1 },

  created: { type: Date, default: Date.now },
  updated: Date,
});

module.exports = mongoose.model("serviceDiscount", schema);
