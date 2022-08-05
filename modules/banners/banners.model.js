const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  fileName: { type: String },
  description: { type: String },
  path: { type: String },
  img: { data: Buffer, contentType: String },
  isActive: { type: Boolean, default: true },
  created: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Banner", schema);
