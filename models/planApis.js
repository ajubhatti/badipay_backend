const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    apiName: { type: String, unique: true, required: true },
    services: { type: Object, default: {} },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("PlanApi", schema);
