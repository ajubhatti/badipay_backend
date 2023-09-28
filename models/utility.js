const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    timeLimit: { type: String },
    timeType: { type: String },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Utility", schema);
