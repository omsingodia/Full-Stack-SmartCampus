const mongoose = require("mongoose");
const examSchema = new mongoose.Schema({
 year:{type:Number,required:true,min:1,max:4},
 subject:{type:String,required:true,trim:true,maxlength:120},
 date:{type:Date,required:true},
 time:{type:String,required:true,trim:true},
 seatingChart:{type:Buffer,default:null,select:false},
 seatingChartType:{type:String,default:""},
 createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true}
},{timestamps:true});
examSchema.plugin(require("../tenancy/tenantScopePlugin"));
module.exports=mongoose.model("Exam",examSchema);
