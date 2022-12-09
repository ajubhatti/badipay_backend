const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  accountNo: { type: String, unique: true, required: true },
  accountName: { type: String, required: true },
  accountDetail: { type: String, required: false },
  ifscCode: { type: String, required: true },
  bankId: { type: Schema.Types.ObjectId, ref: "Banks" },
  bankBranch: { type: String, required: false },
  created: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  updated: Date,
});

module.exports = mongoose.model("BankAccount", schema);
