const {cacheGet,cacheSet,cacheDeletePrefix}=require("../middleware/cache");
const mongoose=require("mongoose");
const Community=require("../models/Community");
const User=require("../models/User");
const getCommunities=async(req,res)=>{try{
 const key=`communities:${req.user.role}:${req.user._id}`;
 const cached=cacheGet(key);
 if(cached) return res.json({...cached,cache:"HIT"});
 const filter={};
 if (["Student","Student CR"].includes(req.user.role)) {
   filter.year = Number(req.user.year || 1);
   filter.course = req.user.className || "";
   filter.section = req.user.section || "";
 }
 const groups=await Community.find(filter).populate("owner","name role").populate("members","name email role").sort({createdAt:-1});
 const payload={success:true,total:groups.length,groups};
 cacheSet(key,payload,20000);
 res.json({...payload,cache:"MISS"});
}catch(e){res.status(500).json({success:false,message:"Unable to load communities"});}};
const createCommunity=async(req,res)=>{try{
 if(req.user.role!=="Teacher")return res.status(403).json({success:false,message:"Only teachers can create class communities"});
 const name=String(req.body.name||"").trim();
 const year=Number(req.body.year), course=String(req.body.course||"").trim(), section=String(req.body.section||"").trim();
 if(!name||![1,2,3,4].includes(year)||!course||!section)return res.status(400).json({success:false,message:"Community name, year, course and section are required"});
 const group=await Community.create({name,year,course,section,owner:req.user._id,members:[req.user._id]});cacheDeletePrefix("communities:");
 res.status(201).json({success:true,group});
}catch(e){res.status(500).json({success:false,message:"Unable to create community"});}};
const getCommunity=async(req,res)=>{try{
 if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({success:false,message:"Invalid community ID"});
 const group=await Community.findById(req.params.id).populate("owner","name role").populate("members","name email role").populate("posts.author","name role");
 if(!group)return res.status(404).json({success:false,message:"Community not found"});
 const allowed=req.user.role==="Admin"||String(group.owner._id)===String(req.user._id)||group.members.some(m=>String(m._id)===String(req.user._id));
 if(!allowed)return res.status(403).json({success:false,message:"Join this community to participate"});
 cacheDeletePrefix("communities:");
 res.json({success:true,group});
}catch(e){res.status(500).json({success:false,message:"Unable to load community"});}};
const addPost=async(req,res)=>{try{
 const group=await Community.findById(req.params.id);if(!group)return res.status(404).json({success:false,message:"Community not found"});
 const allowed=String(group.owner)===String(req.user._id)||req.user.role==="Admin"||group.members.some(m=>String(m)===String(req.user._id));
 if(!allowed)return res.status(403).json({success:false,message:"Join this community to participate"});
 const type=req.body.type||"Discussion",content=String(req.body.content||"").trim();
 const permissions={Teacher:["Announcement","Notes","Assignment","Discussion"],Admin:["Announcement"],"Student CR":["Notes","Discussion"],Student:["Notes","Discussion"]};
 if(!permissions[req.user.role]?.includes(type))return res.status(403).json({success:false,message:"Your role cannot publish this post type"});
 if(!content)return res.status(400).json({success:false,message:"Post content is required"});
 group.posts.push({type,content,author:req.user._id});await group.save();
 const saved=await Community.findById(group._id).populate("owner","name role").populate("members","name email role").populate("posts.author","name role");
 req.app.get("io")?.to(`community:${String(req.campus?._id || "")}:${String(group._id)}`).emit("community-post", { communityId:String(group._id), post:saved.posts[saved.posts.length-1] });
 res.status(201).json({success:true,group:saved});
}catch(e){res.status(500).json({success:false,message:"Unable to publish post"});}};

const addMember=async(req,res)=>{try{
 const group=await Community.findById(req.params.id);if(!group)return res.status(404).json({success:false,message:"Community not found"});
 const isOwner=String(group.owner)===String(req.user._id);
 const isMemberCR=req.user.role==="Student CR"&&group.members.some(m=>String(m)===String(req.user._id));
 const allowed=isOwner||isMemberCR;
 if(!allowed)return res.status(403).json({success:false,message:"You cannot add members to this community"});
 const email=String(req.body.email||"").toLowerCase().trim();
 const allowedRoles=req.user.role==="Student CR"?["Student"]:["Student","Student CR"];
 const student=await User.findOne({email,role:{$in:allowedRoles},isActive:true,className:group.course,section:group.section});
 if(!student)return res.status(404).json({success:false,message:"Active student not found"});
 if(!group.members.some(m=>String(m)===String(student._id)))group.members.push(student._id);
 await group.save();cacheDeletePrefix("communities:");const updated=await Community.findById(group._id).populate("owner","name role").populate("members","name email role").populate("posts.author","name role");
 res.json({success:true,group:updated});
}catch(e){res.status(500).json({success:false,message:"Unable to add member"});}};

const removeMember=async(req,res)=>{try{
 const group=await Community.findById(req.params.id);if(!group)return res.status(404).json({success:false,message:"Community not found"});
 if(req.user.role!=="Teacher"||String(group.owner)!==String(req.user._id))return res.status(403).json({success:false,message:"Only the creating teacher can remove community members"});
 const memberId=String(req.params.memberId);
 if(memberId===String(group.owner))return res.status(400).json({success:false,message:"Community owner cannot be removed"});
 group.members=group.members.filter(m=>String(m)!==memberId);await group.save();cacheDeletePrefix("communities:");
 const updated=await Community.findById(group._id).populate("owner","name role").populate("members","name email role").populate("posts.author","name role");
 res.json({success:true,group:updated});
}catch(e){res.status(500).json({success:false,message:"Unable to remove community member"});}};

const joinCommunity=async(req,res)=>{try{
 const group=await Community.findById(req.params.id);if(!group)return res.status(404).json({success:false,message:"Community not found"});
 if(req.user.role==="Admin")return res.status(403).json({success:false,message:"Admin has read-only community access"});
 if(!["Student","Student CR"].includes(req.user.role))return res.status(403).json({success:false,message:"Only students can self-join"});
 if(group.year!==Number(req.user.year||1)||group.course!==req.user.className||group.section!==req.user.section)return res.status(403).json({success:false,message:"This community is not assigned to your year, course and section"});
 if(!group.members.some(m=>String(m)===String(req.user._id)))group.members.push(req.user._id);
 await group.save();cacheDeletePrefix("communities:");
 const updated=await Community.findById(group._id).populate("owner","name role").populate("members","name email role").populate("posts.author","name role");
 res.json({success:true,group:updated});
}catch(e){res.status(500).json({success:false,message:"Unable to join community"});}};

const updateCommunity=async(req,res)=>{try{
 if(req.user.role!=="Teacher")return res.status(403).json({success:false,message:"Only teachers can edit communities"});
 const group=await Community.findById(req.params.id);if(!group)return res.status(404).json({success:false,message:"Community not found"});
 if(String(group.owner)!==String(req.user._id))return res.status(403).json({success:false,message:"Only the community's creating teacher can edit it"});
 const {name,year,course,section}=req.body||{};
 if(name!==undefined)group.name=String(name).trim();
 if(year!==undefined){if(![1,2,3,4].includes(Number(year)))return res.status(400).json({success:false,message:"Year must be between 1 and 4"});group.year=Number(year);}
 if(course!==undefined)group.course=String(course).trim();
 if(section!==undefined)group.section=String(section).trim();
 await group.save();cacheDeletePrefix("communities:");
 res.json({success:true,group});
}catch(e){res.status(500).json({success:false,message:"Unable to update community"});}};
const deleteCommunity=async(req,res)=>{try{
 if(req.user.role!=="Teacher")return res.status(403).json({success:false,message:"Only teachers can delete communities"});
 const group=await Community.findById(req.params.id);if(!group)return res.status(404).json({success:false,message:"Community not found"});
 if(String(group.owner)!==String(req.user._id))return res.status(403).json({success:false,message:"Only the creating teacher can delete this community"});
 await Community.deleteOne({_id:group._id});cacheDeletePrefix("communities:");
 res.json({success:true,message:"Community deleted"});
}catch(e){res.status(500).json({success:false,message:"Unable to delete community"});}};

module.exports={getCommunities,createCommunity,getCommunity,addPost,addMember,removeMember,joinCommunity,updateCommunity,deleteCommunity};
