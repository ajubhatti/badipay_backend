const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  slabId: { type: String, required: true },
  serviceApiId: {
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
    ref: "company",
    required: true,
  },
  SPKey: { type: String, required: true },
  serviceProviderName: { type: String, required: true },
  serviceProviderDetail: { type: String },
  serviceProviderType: { type: String, required: true },
  discountLimit: { type: Number, default: 0 },
  isBilling: { type: Boolean, required: false },
  businessModel: { type: String },
  providedBy: { type: String, required: false },
  isActive: { type: Boolean, required: false },
  created: { type: Date, default: Date.now },
  updated: Date,
});

module.exports = mongoose.model("Slabs", schema);