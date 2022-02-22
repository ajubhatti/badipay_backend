const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const walletSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'Account' },
    requestAmount: { type: Number, required: true },
    slipNo: { type: String },
    remark: { type: String },
    paymentType: { type: String,required:true },
    bank: { type: Schema.Types.ObjectId, ref: 'BankList' },
    referenceNo: { type: String },
    depositBank: { type: Schema.Types.ObjectId, ref: 'BankList' },
    depositBranch: { type: String },
    remark: { type: String },
    debitAmount: { type: Number },
    creditAmount: { type: Number },
    finalWalletAmount: { type: Number },
    approveBy: { type: Schema.Types.ObjectId, ref: 'Account' },
    approveDate: { type: Date,default:Date.now() },
    password: { type: String },
    statusOfWallet: {
        type: String,
        enum: ['active', 'pending', 'cancel','approve'],
        default: 'active',
    },
    isActive: {type:Boolean,default:true},
});

module.exports = mongoose.model('UserWallet', walletSchema);