const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  serviceProvider: { type: String, unique: true, required: true },
  serviceProviderType: { type: String, required: true },
  SPKey: { type: String, required: false },
  isBilling: { type: Boolean, required: false },
  businessModel: { type: String },
  providedBy: { type: String, required: false },
  created: { type: Date, default: Date.now },
  isActive: { type: Boolean, required: false },
  updated: Date,
});

module.exports = mongoose.model("AmbikaSlabs", schema);
