require("dotenv").config();
const express=require("express");
const cors=require("cors");
const helmet=require("helmet");
const http=require("http");
const {Server}=require("socket.io");
const {rateLimit}=require("express-rate-limit");
const connectDB=require("./config/db");
const {initializeGridFS}=require("./config/gridfs");
const authRoutes=require("./routes/authRoutes");
const userRoutes=require("./routes/userRoutes");
const lostFoundRoutes=require("./routes/lostFoundRoutes");
const reportRoutes=require("./routes/reportRoutes");
const communityRoutes=require("./routes/communityRoutes");
const examRoutes=require("./routes/examRoutes");
const contactRoutes=require("./routes/contactRoutes");
const platformRoutes=require("./routes/platformRoutes");
const dashboardRoutes=require("./routes/dashboardRoutes");
const resolveTenant=require("./tenancy/resolveTenant");
const {cacheMetrics}=require("./middleware/cache");
const jwt=require("jsonwebtoken");
const User=require("./models/User");
const app=express();
const server=http.createServer(app);
const origins=(process.env.CLIENT_URL||"http://localhost:5173").split(",").map(x=>x.trim());
const io=new Server(server,{cors:{origin:true,methods:["GET","POST","PATCH","DELETE"],credentials:false}});
app.set("io",io);
app.use(helmet());
app.use(cors({origin:async(origin,cb)=>{
 if(!origin||origins.includes(origin))return cb(null,true);
 try{
  const parsed=new URL(origin);const host=parsed.hostname.toLowerCase();
  const root=String(process.env.ROOT_DOMAIN||"campuscare.in").toLowerCase();
  if(host===root||host.endsWith(`.${root}`))return cb(null,true);
  const Campus=require("./models/Campus");
  const match=await Campus.findOne({status:"active",domains:host}).select("_id").lean();
  return cb(null,!!match);
 }catch{return cb(new Error("Origin not allowed by CampusCare CORS policy"));}
},credentials:false}));
app.use(express.json({limit:"1mb"}));
app.use(express.urlencoded({extended:true}));
app.get("/api/cache-metrics",cacheMetrics);
app.get("/api/health",(req,res)=>res.json({success:true,message:"CampusCare API is running"}));
app.get("/api/db-health",(req,res)=>{const mongoose=require("mongoose");res.json({success:true,connected:mongoose.connection.readyState===1,database:mongoose.connection.name});});
app.use("/api/platform",platformRoutes);
app.use("/api",resolveTenant);
app.use("/api/auth",authRoutes);
app.use("/api/users",userRoutes);
app.use("/api/lost-found",lostFoundRoutes);
app.use("/api/reports",reportRoutes);
app.use("/api/communities",communityRoutes);
app.use("/api/exams",examRoutes);
app.use("/api/contact",contactRoutes);
app.use("/api/dashboard",dashboardRoutes);
app.use((err,req,res,next)=>{console.error(err.message);res.status(err.status||500).json({success:false,message:err.message||"Internal server error"});});
io.use(async (socket,next)=>{try{
 const token=socket.handshake.auth?.token;
 const campusSlug=String(socket.handshake.auth?.campusSlug||"").toLowerCase().trim();
 if(!token||!campusSlug)return next(new Error("Authentication and campus selection required"));
 const Campus=require("./models/Campus");
 const campus=await Campus.findOne({slug:campusSlug,status:"active"}).lean();
 if(!campus)return next(new Error("Campus not found"));
 const decoded=jwt.verify(token,process.env.JWT_SECRET);
 const {runWithTenant}=require("./tenancy/context");
 let user;
 await new Promise((resolve,reject)=>runWithTenant({tenantId:campus._id,campus},async()=>{try{user=await User.findById(decoded.id);resolve()}catch(e){reject(e)}}));
 if(!user||!user.isActive||decoded.tokenVersion!==user.tokenVersion)return next(new Error("Invalid session"));
 socket.data.user={id:String(user._id),role:user.role,tenantId:String(campus._id),campusSlug};
 next();
 }catch(e){next(new Error("Unauthorized socket connection"));}});
io.on("connection",socket=>{
 socket.join(`user:${socket.data.user.id}`);
 socket.on("join-community",async communityId=>{
  try { const Community=require("./models/Community");
   const {runWithTenant}=require("./tenancy/context");
   let allowed=false;
   await new Promise((resolve,reject)=>runWithTenant({tenantId:socket.data.user.tenantId},async()=>{try{
    const group=await Community.findById(communityId).select("members owner");
    allowed=!!(group&&(String(group.owner)===socket.data.user.id||group.members.some(m=>String(m)===socket.data.user.id)));
    resolve();
   }catch(e){reject(e)}}));
   if(allowed) socket.join(`community:${socket.data.user.tenantId}:${communityId}`);
  } catch {}
 });
});
const start=async()=>{try{
 if(!process.env.JWT_SECRET)throw new Error("JWT_SECRET is missing from environment variables");
 await connectDB();initializeGridFS();
 const port=process.env.PORT||5000;
 server.listen(port,()=>console.log(`CampusCare API running on port ${port}`));
}catch(e){console.error("Startup failed:",e.message);process.exit(1);}};
start();
