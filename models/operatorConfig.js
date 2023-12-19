const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    slabId: { type: String, required: true },

    apiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Apis",
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Services",
      required: true,
    },
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Operator",
      required: true,
    },
    apiCode: { type: String, required: false, default: null },
    isActive: { type: Boolean, required: false, default: true },

    priority: { type: Number, required: false, default: null },
    failureLimit: { type: Number, required: false, default: null },
    pendingLimit: { type: Number, required: false, default: null },
    totalPending: { type: Number, required: false, default: null },

    created: { type: Date, default: Date.now },
    updated: Date,
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("OperatorConfig", schema);
