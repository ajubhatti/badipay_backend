const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const supportSchema = new Schema(
  {
    title: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    created: { type: Date, default: Date.now },
    updated: Date,
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Supports", supportSchema);
