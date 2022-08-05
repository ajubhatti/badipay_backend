const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const faqsSchema = new Schema({
  title: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  created: { type: Date, default: Date.now },
  updated: Date,
});

module.exports = mongoose.model("Faqs", faqsSchema);
