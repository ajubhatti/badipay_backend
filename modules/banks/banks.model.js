const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    bankName : {type :String,unique:true,required:true},
    bankDetail: { type: String, required: false },
    created: { type: Date, default: Date.now },
    updated: Date
});

module.exports = mongoose.model('Banks', schema);