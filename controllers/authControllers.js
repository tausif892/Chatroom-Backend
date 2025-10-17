const User = require("../database/user.js");
const argon = require("argon2");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const e = require("express");
const user = require("../database/user.js");

const JWT_SECRET_KEY = "123/*+QWERTY";

exports.registerUser = asyncHandler(async(req, res) => {
    try{
        const {name, username, password, emailId, phoneNumber}=req.body;
        if (!name || !username || !password || !emailId || !phoneNumber){
            return res.status(400).json({message: "Missing fields."});
        }

        const existing = await User.findOne({username});

        if (!existing){
            console.log(`There is no account with these credentials. Making a new account...`);
            const encrypt_pass = await argon.hash(password);
            console.log(`The password is ${encrypt_pass}`);
            const user = await User.create({
                name: name,
                username: username,
                password: encrypt_pass,
                emailId: emailId,
                phoneNumber: phoneNumber,
                contacts: []
            });

            const token = jwt.sign({
                name: user.name,
                id: user._id,
                username: user.username,
                password: user.password,
                emailId: emailId,
                phoneNumber: phoneNumber
            }, JWT_SECRET_KEY, {expiresIn: "30d"}
        );

        res.status(200).json(`The account has been created. The information is ${user} ${token}`);
        }else{
            console.log(`The account exists.`);
            return;
        }
    }catch(e){
        res.json(`There was an error ${e}`);
    }
});

exports.loginUser = asyncHandler(async (req, res) => {
  try {
    const { username, password} = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Missing fields' });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    console.log(`The password is ${password}`);
    console.log(`The username in the db is ${user.username}`)
    console.log(`The user password in the database is ${user.password}`)
    console.log(`The user email id is ${user.emailId}`);
    console.log(`The user phone number is ${user.phoneNumber}`);
    const ok = await argon.verify(user.password,password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, username: user.username, emailId: user.emailId, phoneNumber: user.phoneNumber }, JWT_SECRET_KEY, { expiresIn: '7d' });
    res.json({ user: { id: user._id, username: user.username, emailId: user.emailId, phoneNumber: user.phoneNumber}, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

exports.updateUser = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password);
    }
    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: { id: user._id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

exports.deleteUser = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


