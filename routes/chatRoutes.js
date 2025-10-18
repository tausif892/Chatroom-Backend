const express=require("express");
const router = express.Router();
const {getMessage, postMessages,getContacts, sellerInformation} = require("../controllers/chatControllers.js");
router.post("/get",getMessage);
router.post("/post",postMessages);
router.post("/getContacts",getContacts);
router.get("/getSellers",sellerInformation);
module.exports=router;