const mongoose = require("mongoose");
const schema = new mongoose.Schema({
 name:{type:String,required:true,trim:true,maxlength:80},
 email:{type:String,required:true,trim:true,lowercase:true},
 message:{type:String,required:true,trim:true,maxlength:3000},
 status:{type:String,enum:["New","Reviewed"],default:"New"}
},{timestamps:true});
schema.plugin(require("../tenancy/tenantScopePlugin"));
module.exports=mongoose.model("ContactMessage",schema);
