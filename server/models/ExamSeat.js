const mongoose = require("mongoose");
const schema = new mongoose.Schema({
 exam:{type:mongoose.Schema.Types.ObjectId,ref:"Exam",required:true},
 student:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
 hall:{type:String,required:true,trim:true},
 seat:{type:String,required:true,trim:true}
},{timestamps:true});
schema.index({exam:1,student:1},{unique:true});
schema.plugin(require("../tenancy/tenantScopePlugin"));
module.exports=mongoose.model("ExamSeat",schema);
