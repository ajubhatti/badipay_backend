const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const supportSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  faqId: { type: Schema.Types.ObjectId, ref: "supports" },
  isActive: { type: Boolean, default: true },
  created: { type: Date, default: Date.now },
  updated: Date,
});

module.exports = mongoose.model("SubFaqs", supportSchema);
