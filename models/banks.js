const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    bankName: { type: String, unique: true, required: true },
    bankDetail: { type: String, required: false },
    isActive: { type: Boolean, default: true },
    created: { type: Date, default: Date.now },
    updated: Date,
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Banks", schema);
