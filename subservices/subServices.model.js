const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    serviceId: {},
    subServiceName : {type :String,unique:true,required:true},
    subServiceDetail : {type:String,required :false},
    serviceImage : {type : String,required : false},
    created: { type: Date, default: Date.now },
    updated: Date
});

module.exports = mongoose.model('SubServices', schema);