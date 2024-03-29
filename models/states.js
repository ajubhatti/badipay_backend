const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    stateName: { type: String, unique: true, required: true },
    stateCode: { type: String, required: false },
    stateKey: { type: String, required: false },
    isActive: { type: Boolean, default: true },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("States", schema);
