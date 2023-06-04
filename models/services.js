const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  serviceName: { type: String, unique: true, required: true },
  serviceDetail: { type: String, required: false },
  title: { type: String, required: true },
  serviceImage: { type: String, required: false },
  isActive: { type: Boolean, default: true },
  created: { type: Date, default: Date.now },
  icon: { type: String },
  updated: Date,
});

module.exports = mongoose.model("Services", schema);
