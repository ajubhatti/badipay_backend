const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    resource: { type: Object, default: {} },
    // callBackUrl: {},
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("CallBack", schema);
