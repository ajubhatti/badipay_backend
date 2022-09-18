const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  companyName: { type: String, unique: true, required: true },
  mobileAppCode: { type: String, required: false },
  companyDetail: { type: String, required: false },
  image: { type: String, required: false },
  isActive: { type: Boolean, default: true },
  created: { type: Date, default: Date.now },
  isVisible: { type: Boolean, default: true },
  providerType: { type: Schema.Types.ObjectId, ref: "Services" },
  minAmount: { type: Number, default: 10 },
  maxAmount: { type: Number, default: 500 },
  updated: Date,
});

module.exports = mongoose.model("company", schema);
