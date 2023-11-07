const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    response: { type: Object, default: {} },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("ApiResponse", schema);
