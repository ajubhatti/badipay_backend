const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  apiName: { type: String, unique: true, required: true },
  apiDetail: { type: String, required: false },
  apiImage: { type: String, required: false, default: "" },
  isActive: { type: Boolean, default: true },
  created: { type: Date, default: Date.now },
  updated: Date,
});

module.exports = mongoose.model("Apis", schema);
