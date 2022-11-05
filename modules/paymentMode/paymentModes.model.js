const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    modeName : {type :String,unique:true,required:true},
    isActive: {type:Boolean,default:true},
    created: { type: Date, default: Date.now },
    updated: Date
});

module.exports = mongoose.model('PaymentMode', schema);