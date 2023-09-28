const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    description: { type: String },
    path: { type: String },
    isActive: { type: Boolean, default: true },
    created: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Banner", schema);
