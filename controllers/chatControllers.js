const Chat = require("../database/chat.js");
const asyncHandler = require("express-async-handler");
const User = require("../database/user.js");
const mongoose = require("mongoose");

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
                {sender: reciever, receiver: sender}
            ]
        }).sort({TimeStamp: 1});

        res.status(200).json({chat});
    }catch(e){
        console.log(`The error is ${e}`);
    }
});

exports.postMessages = asyncHandler(async (req, res) => {
  const { sender, receiver, content } = req.body;

  if (!sender || !receiver || !content) {
    return res.status(400).json({ message: "All required fields must be provided" });
  }

  try {
    // Save chat message
    const message = await Chat.create({ sender: sender, receiver: receiver, content: content });

    await message.save();

    // Fetch users
    const [senderUser, receiverUser] = await Promise.all([
      User.findOne({ _id: sender }),
      User.findOne({ _id: receiver })
    ]);

    if (!senderUser || !receiverUser) {
      return res.status(404).json({ message: "Sender or receiver not found" });
    }

    const now = new Date();

    // Update sender's contacts
    senderUser.contacts = senderUser.contacts ?? {};
    senderUser.contacts[receiver.toString()] = {
      your_name: receiverUser.name || "",
      last_sender_name: senderUser.name || "",
      last_sender: sender,
      last_message: content,
      last_time: now,
    };

    // Update receiver's contacts
    receiverUser.contacts = senderUser.contacts ?? {};
    receiverUser.contacts[sender.toString()] = {
      my_name: receiverUser.name || "",
      last_reciever_name: receiverUser.name || "",
      last_sender_name: senderUser.name || "",
      last_sender: sender,
      last_message: content,
      last_time: now,
    };

    // Save both
    await Promise.all([senderUser.save(), receiverUser.save()]);

    res.status(201).json({ message: "Message posted successfully", chatId: message._id });
  } catch (err) {
    console.error("Error posting message:", err);
    res.status(500).json({ message: "Server error" });
  }
});

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
        for (const [contactId, contactData] of user.contacts) {
            contactsArray.push({
                your_name_name: contactData.get("your_name") || "",
                last_reciever_name: contactData.get("last_reciever_name") || "",
                last_sender_name: contactData.get("last_sender_name") || "",
                last_sender: contactId || "",
                last_message: contactData.get("last_message") || "",
                last_time: contactData.get("last_time") || "",

            });
        }
        res.status(200).json({ contacts: contactsArray });
    } catch (e) {
        console.log(`Error fetching contacts: ${e}`);
        res.status(500).json({ message: "Server error" });
    }
});
