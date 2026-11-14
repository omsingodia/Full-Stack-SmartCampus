const mongoose = require("mongoose");
const schema = new mongoose.Schema({
 exam:{type:mongoose.Schema.Types.ObjectId,ref:"Exam",required:true},
 student:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
 message:{type:String,required:true,trim:true,maxlength:2000},
 status:{type:String,enum:["Pending","Reviewed","Resolved"],default:"Pending"},
 adminNote:{type:String,default:"",trim:true}
},{timestamps:true});
schema.plugin(require("../tenancy/tenantScopePlugin"));
module.exports=mongoose.model("ExamRequest",schema);
