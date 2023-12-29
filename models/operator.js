const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    operatorName: { type: String, unique: true, required: true },
    operatorDetail: { type: String, required: false },
    image: { type: String, required: false },
    isActive: { type: Boolean, default: true },
    isVisible: { type: Boolean, default: true },
    providerType: { type: Schema.Types.ObjectId, ref: "Services" },
    serviceId: { type: Schema.Types.ObjectId, ref: "Services" },
    minAmount: { type: Number, default: 10 },
    maxAmount: { type: Number, default: 500 },
    discountByApi: { type: Array },
    requiredFields: { type: Array },
    mplanCode: { type: String },
    created: { type: Date, default: Date.now },
    updated: Date,
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Operator", schema);
