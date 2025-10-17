const express = require("express");
const router = express.Router();
const {registerUser, loginUser, deleteUser, updateUser} = require("../controllers/authControllers");

router.post('/register', registerUser);
router.post('/login',loginUser);
router.delete('/delete/:id',deleteUser);
router.put('/update/:id',updateUser);

module.exports=router;