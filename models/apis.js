const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    apiName: { type: String, unique: true, required: true },
    apiDetail: { type: String, required: false },
    apiImage: { type: String, required: false, default: "" },
    isActive: { type: Boolean, default: true },

    // ====================================
    token: { type: String, required: false },
    // ====================================
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Apis", schema);
