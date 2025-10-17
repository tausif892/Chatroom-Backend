require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const Chat = require("./database/chat.js");
const User = require("./database/user.js");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/otp", require("./routes/otpRoutes.js"));
app.use("/auth", require("./routes/authRoutes"));
app.use("/chat", require("./routes/chatRoutes"));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "123/*+QWERTY";
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://mohammadtausif2005:1%40Pathanwadi@chat.s7blolj.mongodb.net/?retryWrites=true&w=majority&appName=chat";

const clients = new Map(); // userId -> ws

function sendJSON(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

wss.on("connection", async (ws, req) => {
  const params = new URLSearchParams(req.url.replace(/^.*\?/, ""));
  const token = params.get("token");

  if (!token) {
    ws.close(1008, "Missing token");
    return;
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET_KEY);
  } catch (err) {
    ws.close(1008, "Invalid token");
    console.error("❌ Token verification failed:", err);
    return;
  }

  const userId = payload.id.toString();
  clients.set(userId, ws);
  console.log(`✅ User connected: ${payload.username} (${userId})`);

  sendJSON(ws, { type: "connected", userId });

  ws.on("message", async (raw) => {
    try {
      const data = JSON.parse(raw);
      if (!data.type) return;

      if (data.type === "message") {
        const toId = String(data.to);
        const content = data.content?.trim();

        if (!toId || !content) {
          sendJSON(ws, { type: "error", message: "Receiver ID or content missing" });
          return;
        }

        console.log(`💬 ${userId} → ${toId}: ${content}`);

        // 1️⃣ Save chat message
        const msg = await Chat.create({
          sender: userId,
          receiver: toId,
          content,
        });

        // 2️⃣ Update contacts for both users
        const [senderUser, receiverUser] = await Promise.all([
          User.findById(userId),
          User.findById(toId),
        ]);

        if (senderUser && receiverUser) {
          const now = new Date();
          const contactDataForSender = {
            your_name: receiverUser.name,
            last_reciever_name: receiverUser.name,
            last_sender_name: senderUser.name,
            last_sender: userId,
            last_message: content,
            last_time: now,
          };

          const contactDataForReceiver = {
            your_name: senderUser.name,
            last_reciever_name: receiverUser.name,
            last_sender_name: senderUser.name,
            last_sender: userId,
            last_message: content,
            last_time: now,
          };

          if (!senderUser.contacts) senderUser.contacts = new Map();
          if (!receiverUser.contacts) receiverUser.contacts = new Map();

          // ✅ Proper Map-based update
          senderUser.contacts.set(toId, contactDataForSender);
          receiverUser.contacts.set(userId, contactDataForReceiver);

          await Promise.all([senderUser.save(), receiverUser.save()]);
          console.log(`🟢 Contacts updated for both users`);
        } else {
          console.warn(`⚠️ One or both users not found in DB`);
        }

        // 3️⃣ Send message to receiver (if online)
        const outgoing = {
          type: "message",
          message: {
            id: msg._id,
            sender: userId,
            receiver: toId,
            content,
            timeStamp: msg.timeStamp,
          },
        };

        const receiverWs = clients.get(toId);
        if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
          sendJSON(receiverWs, outgoing);
        }

        // 4️⃣ Send back confirmation to sender
        sendJSON(ws, outgoing);

      } else if (data.type === "ping") {
        sendJSON(ws, { type: "pong" });
      } else {
        sendJSON(ws, { type: "error", message: "Unknown message type" });
      }
    } catch (err) {
      console.error("❌ Message handling error:", err);
      sendJSON(ws, { type: "error", message: "Invalid message format" });
    }
  });

  ws.on("close", () => {
    clients.delete(userId);
    console.log(`🚪 User disconnected: ${userId}`);
  });

  ws.on("error", (err) => {
    console.error(`⚠️ WebSocket error for ${userId}:`, err);
  });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });
