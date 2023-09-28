const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const supportSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    supportId: { type: Schema.Types.ObjectId, ref: "supports" },
    isActive: { type: Boolean, default: true },
    created: { type: Date, default: Date.now },
    updated: Date,
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("SubSupports", supportSchema);
