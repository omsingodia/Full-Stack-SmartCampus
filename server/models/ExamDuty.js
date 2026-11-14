const mongoose = require("mongoose");
const schema = new mongoose.Schema({
 exam:{type:mongoose.Schema.Types.ObjectId,ref:"Exam",default:null},
 year:{type:Number,required:true,min:1,max:4},
 hall:{type:String,required:true,trim:true},
 date:{type:Date,required:true},
 time:{type:String,required:true,trim:true},
 teacher:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true}
},{timestamps:true});
schema.index({exam:1,teacher:1});
schema.plugin(require("../tenancy/tenantScopePlugin"));
module.exports=mongoose.model("ExamDuty",schema);
