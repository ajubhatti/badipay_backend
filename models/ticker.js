const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  description: { type: String },
  isActive: { type: Boolean, default: true },
  created: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Ticker", schema);
