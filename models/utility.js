const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    timeOutFrame: { type: String },
  },
  { timeStamp: true }
);

module.exports = mongoose.model("Utility", schema);
