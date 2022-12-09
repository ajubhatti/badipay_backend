const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: false },
  subject: { type: String, required: true },
  mobileNo: { type: String, required: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  created: { type: Date, default: Date.now },
  updated: Date,
});

module.exports = mongoose.model("Contactus", schema);
