const ContactMessage=require("../models/ContactMessage");
const createMessage=async(req,res)=>{try{
 const {name,email,message}=req.body;
 if(!name||!email||!message||!/^\S+@\S+\.\S+$/.test(email))return res.status(400).json({success:false,message:"Valid name, email and message are required"});
 await ContactMessage.create({name,email,message});
 res.status(201).json({success:true,message:"Message received"});
}catch(e){res.status(500).json({success:false,message:"Unable to send message"});}};
module.exports={createMessage};
