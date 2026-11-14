const mongoose=require("mongoose");
const Exam=require("../models/Exam"), Seat=require("../models/ExamSeat"), Duty=require("../models/ExamDuty"), Request=require("../models/ExamRequest"), User=require("../models/User");
const getExams=async(req,res)=>{try{
 const [exams,allSeats,duties,requests,teachers]=await Promise.all([
  Exam.find().select("+seatingChartType").sort({date:1}),
  Seat.find().populate("exam").populate("student","name email role").sort({createdAt:-1}),
  Duty.find().populate("exam").populate("teacher","name email role").sort({date:1}),
  req.user.role==="Admin"?Request.find().populate("exam").populate("student","name email").sort({createdAt:-1}):Request.find({student:req.user._id}).populate("exam").populate("student","name email"),
  req.user.role==="Admin"?User.find({role:"Teacher",isActive:true}).select("name email role").sort({name:1}):Promise.resolve([])
 ]);
 const seats=req.user.role==="Admin"?allSeats:allSeats.filter(s=>String(s.student?._id)===String(req.user._id));
 const visibleDuties=req.user.role==="Teacher"?duties.filter(d=>String(d.teacher?._id)===String(req.user._id)):req.user.role==="Admin"?duties:[];
 const visibleExams=exams.map(e=>({ ...e.toObject(), hasSeatingChart:!!e.seatingChartType, seatingChartType:e.seatingChartType }));
 res.json({success:true,exams:visibleExams,seats,duties:visibleDuties,requests,teachers});
}catch(e){console.error(e);res.status(500).json({success:false,message:"Unable to fetch examinations"});}};
const createExam=async(req,res)=>{try{
 const {year,subject,date,time,teacherEmail,hall}=req.body;
 if(![1,2,3,4].includes(Number(year))||!String(subject||"").trim()||!date||!time)return res.status(400).json({success:false,message:"Year, exam name, date and time are required"});
 const exam=await Exam.create({year:Number(year),subject:String(subject).trim(),date,time,createdBy:req.user._id});
 let duty=null;
 if(teacherEmail||hall){
  if(!teacherEmail||!hall){await Exam.findByIdAndDelete(exam._id);return res.status(400).json({success:false,message:"Both teacher email and hall are required to assign duty"});}
  const teacher=await User.findOne({email:String(teacherEmail).toLowerCase().trim(),role:"Teacher",isActive:true});
  if(!teacher){await Exam.findByIdAndDelete(exam._id);return res.status(404).json({success:false,message:"Active teacher not found"});}
  duty=await Duty.create({exam:exam._id,year:exam.year,hall,date:exam.date,time:exam.time,teacher:teacher._id});
 }
 res.status(201).json({success:true,exam,duty});
}catch(e){console.error(e);res.status(500).json({success:false,message:"Unable to create exam"});}};
const uploadSeatingChart=async(req,res)=>{try{
 const exam=await Exam.findById(req.params.id);if(!exam)return res.status(404).json({success:false,message:"Exam not found"});
 if(!req.file)return res.status(400).json({success:false,message:"Please select a seating chart image"});
 exam.seatingChart=req.file.buffer;exam.seatingChartType=req.file.mimetype;await exam.save();
 res.json({success:true,message:"Seating chart uploaded successfully"});
}catch(e){res.status(500).json({success:false,message:"Unable to upload seating chart"});}};
const getSeatingChart=async(req,res)=>{try{
 const exam=await Exam.findById(req.params.id).select("+seatingChart");
 if(!exam||!exam.seatingChart)return res.status(404).json({success:false,message:"Seating chart not found"});
 res.set("Content-Type",exam.seatingChartType||"image/png");res.set("Cache-Control","private, no-store");res.set("X-Content-Type-Options","nosniff");res.send(exam.seatingChart);
}catch(e){res.status(500).json({success:false,message:"Unable to retrieve seating chart"});}};
const assignSeat=async(req,res)=>{try{
 const {examId,studentEmail,hall,seat}=req.body;if(!mongoose.isValidObjectId(examId)||!studentEmail||!hall||!seat)return res.status(400).json({success:false,message:"Exam, student email, hall and seat are required"});
 const [exam,student]=await Promise.all([Exam.findById(examId),User.findOne({email:String(studentEmail).toLowerCase().trim(),role:{$in:["Student","Student CR"]},isActive:true})]);
 if(!exam)return res.status(404).json({success:false,message:"Exam not found"});if(!student)return res.status(404).json({success:false,message:"Active student not found"});
 const assigned=await Seat.findOneAndUpdate({exam:examId,student:student._id},{hall,seat},{new:true,upsert:true,runValidators:true});
 res.status(200).json({success:true,seat:assigned});
}catch(e){res.status(500).json({success:false,message:"Unable to assign seat"});}};
const assignDuty=async(req,res)=>{try{
 const {examId,year,hall,date,time,teacherEmail}=req.body;
 if(!teacherEmail||!hall||!date||!time)return res.status(400).json({success:false,message:"Exam, teacher, hall, date and time are required"});
 const [teacher,exam]=await Promise.all([User.findOne({email:String(teacherEmail).toLowerCase().trim(),role:"Teacher",isActive:true}),examId?Exam.findById(examId):Promise.resolve(null)]);
 if(!teacher)return res.status(404).json({success:false,message:"Active teacher not found"});
 if(examId&&!exam)return res.status(404).json({success:false,message:"Exam not found"});
 const duty=await Duty.create({exam:exam?._id||null,year:Number(exam?.year||year),hall,date,time,teacher:teacher._id});
 res.status(201).json({success:true,duty});
}catch(e){res.status(500).json({success:false,message:"Unable to assign teacher duty"});}};
const updateDuty=async(req,res)=>{try{
 const duty=await Duty.findById(req.params.id);if(!duty)return res.status(404).json({success:false,message:"Duty not found"});
 const {teacherEmail,hall,date,time}=req.body;
 if(teacherEmail){const teacher=await User.findOne({email:String(teacherEmail).toLowerCase().trim(),role:"Teacher",isActive:true});if(!teacher)return res.status(404).json({success:false,message:"Active teacher not found"});duty.teacher=teacher._id;}
 if(hall)duty.hall=hall;if(date)duty.date=date;if(time)duty.time=time;
 await duty.save();res.json({success:true,duty});
}catch(e){res.status(500).json({success:false,message:"Unable to update duty"});}};
const createRequest=async(req,res)=>{try{
 const {examId,message}=req.body;if(!mongoose.isValidObjectId(examId)||!String(message||"").trim())return res.status(400).json({success:false,message:"Exam and request details are required"});
 const exam=await Exam.findById(examId);if(!exam)return res.status(404).json({success:false,message:"Exam not found"});
 const request=await Request.create({exam:examId,student:req.user._id,message:String(message).trim()});res.status(201).json({success:true,request});
}catch(e){res.status(500).json({success:false,message:"Unable to submit exam request"});}};
const updateExam=async(req,res)=>{try{
 const exam=await Exam.findById(req.params.id);if(!exam)return res.status(404).json({success:false,message:"Exam not found"});
 const {year,subject,date,time}=req.body;
 if(year!==undefined){if(![1,2,3,4].includes(Number(year)))return res.status(400).json({success:false,message:"Year must be 1–4"});exam.year=Number(year);}
 if(subject!==undefined){if(!String(subject).trim())return res.status(400).json({success:false,message:"Exam name required"});exam.subject=String(subject).trim();}
 if(date!==undefined)exam.date=date;
 if(time!==undefined)exam.time=time;
 await exam.save();res.json({success:true,exam});
}catch(e){res.status(500).json({success:false,message:"Unable to update exam"});}};
const deleteExam=async(req,res)=>{try{
 const exam=await Exam.findById(req.params.id);if(!exam)return res.status(404).json({success:false,message:"Exam not found"});
 await Seat.deleteMany({exam:exam._id});await Duty.deleteMany({exam:exam._id});
 await Exam.deleteOne({_id:exam._id});
 res.json({success:true,message:"Exam and associated records deleted"});
}catch(e){res.status(500).json({success:false,message:"Unable to delete exam"});}};
module.exports={getExams,createExam,updateExam,deleteExam,uploadSeatingChart,getSeatingChart,assignSeat,assignDuty,updateDuty,createRequest};
