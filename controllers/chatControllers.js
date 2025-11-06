const Chat = require("../database/chat.js");
const asyncHandler = require("express-async-handler");
const User = require("../database/user.js");
const mongoose = require("mongoose");
const user = require("../database/user.js");
const { urlencoded } = require("express");

exports.getMessage = asyncHandler(async (req, res) => {
    try{
        const {sender, reciever}=req.body;
        if (!sender || !reciever){
            console.log(`The sender and recipient both are needed.`);
            return;
        }

        const chat = await Chat.find({
            $or: [
                {sender: sender, receiver: reciever},
                {sender: reciever, receiver: sender},
            ]
        }).sort({TimeStamp: 1})
        console.log(`THE CHAT HISTORY BETWEEN THE TWO PARTIES IS THIS ${chat}`);
        return res.status(200).json({chat});
    }catch(e){
        console.log(`The error is ${e}`);
    }
});

exports.postMessages =async function (sender, receiver, content) {

  if (!sender || !receiver || !content) {
    return res.status(400).json({ message: "All required fields must be provided" });
  }

  try {
    // Save chat message
    const message = await Chat.create({ sender, receiver, content });
    await message.save();
    let senderExists;
    let recieverExists;
    // Fetch users
    const [senderUser, receiverUser] = await Promise.all([
      User.findById(sender),
      User.findById(receiver)
    ]);


    const now = new Date();
    try{
    senderExists = senderUser.contacts.some(c => c.id ===String(receiver));
    recieverExists = receiverUser.contacts.some(c=>c.id===String(sender));
    }catch(e){
      console.log(`ERROR FINDING THE CONTACTS IN SENDER AND RECIEVER ${e}`);
    }

    try{if (!senderExists){
      senderUser.contacts.push(
        {
          "id": receiverUser.id,
          "name": receiverUser.name
        }
      )
    }

    if (!recieverExists){
      receiverUser.contacts.push(
        {
          "id": senderUser.id,
          "name": senderUser.name
        }
      )
    }}catch(e){
      console.log(`ERROR ADDING CONTACTS IN POSTMESSAGE ${e}`);
    }

    // Save both users
    await Promise.all([senderUser.save(), receiverUser.save()]);
    console.log(`ALL THE FUNCTIONS ARE COMPLETE`);

  } catch (err) {
    console.error("Error posting message:", err);
  }
};

exports.getContacts = asyncHandler(async (req, res) => {
    const { email_id } = req.body; 

    if (!email_id) {
        res.status(400).json({ message: "Email id is required" });
        return;
    }

    try {
        const user = await User.findOne({ emailId: email_id });

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        const contactsArray = [];
        try{for (const c of user.contacts) {
            contactsArray.push({
                id: c.id,
                name: c.name
            });
        }}catch(e){
          console.log(`THERE WAS AN ERROR FETCHING CONTACT LOOP ${e}`);
        }
        res.status(200).json({ contacts: contactsArray });
    } catch (e) {
        console.log(`Error fetching contacts: ${e}`);
        res.status(500).json({ message: "Server error" });
    }
});


exports.sellerInformation = asyncHandler(async (req, res) => {
  try {
    // fetch all users (sellers)
    const users = await User.find();

    // normalize into an array of objects
    const sellers = users.map((u) => ({
      id: u._id.toString(), // always string
      name: u.name || u.username || "Unknown",
    }));

    console.log("THE SELLERS ARE", sellers);

    // send as JSON
    return res.status(200).json(sellers);
  } catch (err) {
    console.error("❌ Error fetching sellers:", err);
    return res.status(500).json({ message: "Failed to fetch sellers" });
  }
});

exports.getRecommendations = async function (query, seller) {
  console.log(`IN CHAT CONTROLLER, THE QUERY IS ${query}`);

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/query?q=${encodeURIComponent(query)}&seller=${encodeURIComponent(seller)}`
    );

    // ✅ Log non-OK responses instead of crashing
    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ Azure RAG API error: ${response.status} ${response.statusText}`);
      console.error(`Response text: ${text}`);
      throw new Error(`Azure API returned ${response.status}: ${text}`);
    }

    // ✅ Parse JSON safely
    const data = await response.json();
    return data;

  } catch (err) {
    console.error("❌ Error in getRecommendations:", err.message);
    // Return a safe fallback instead of crashing your WebSocket handler
    return { error: true, message: "AI service failed. Try again later." };
  }
};
