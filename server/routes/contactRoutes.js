const router=require("express").Router();const {rateLimit}=require("express-rate-limit");const {createMessage}=require("../controllers/contactController");
const limit=rateLimit({windowMs:15*60*1000,limit:5,standardHeaders:"draft-8",legacyHeaders:false,message:{success:false,message:"Too many messages. Try again later."}});
router.post("/",limit,createMessage);module.exports=router;
