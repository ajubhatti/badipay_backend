const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    serviceName : {type :String,unique:true,required:true},
    serviceDetail : {type:String,required :false},
    serviceImage : {type : String,required : false},
    created: { type: Date, default: Date.now },
    updated: Date
});

module.exports = mongoose.model('Services', schema);