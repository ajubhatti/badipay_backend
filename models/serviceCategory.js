const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    categoryName: { type: String },
    categoryType: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("ServiceCategory", schema);
