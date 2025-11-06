require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const Chat = require("./database/chat.js");
const User = require("./database/user.js");
const { getRecommendations,postMessages } = require("./controllers/chatControllers.js");
const { timeStamp } = require("console");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/otp", require("./routes/otpRoutes.js"));
app.use("/auth", require("./routes/authRoutes"));
app.use("/chat", require("./routes/chatRoutes"));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;

const clients = new Map();

function sleep(ms){
  return new Promise(resolve => setTimeout(resolve,ms));
}

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
        const prevmessage = await Chat.find({
            $or:[
              {sender: userId, receiver: toId},
              {sender: toId, receiver: userId}
            ]
          }).limit(1);
          console.log(`PREVIOUS MESSAGE LENGTH IS : ${prevmessage.length}`);
        if (!toId || !content) {
          sendJSON(ws, { type: "error", message: "Receiver ID or content missing" });
          return;
        }
        await postMessages(userId, toId , content);

        console.log(`💬 ${userId} → ${toId}: ${content}`);
          let recommend;
          let message;
          let receiverWs;
          
          receiverWs = await clients.get(toId);
                  const outgoing = {
          type: "message",
          message: {
            sender: userId,
            receiver: toId,
            content
          },
        };
        console.log(`THE MESSAGE IS SENT TO THE SELLER NOW`);

         receiverWs = await clients.get(toId);
        if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
          sendJSON(receiverWs, outgoing);
        }
        sendJSON(ws, outgoing);

          

          if (prevmessage.length===0){
            await sleep(2000);
            console.log(`THIS IS THE FIRST MESSAGE BETWEEN THE TWO NOW!`);

            const welcomeText =
            "👋 **Welcome to Ind2b!**\n\n" +
            "We’re glad to have you here. You can **chat directly with sellers** or **talk to our AI assistant** for quick help.\n\n" +
            "To begin, click the **chat button on the left side of the search bar**.\n\n" +
            "Thank you for choosing **Ind2b**!";

             const welcomemessage = {
              type: "message",
              message: {
                id: new mongoose.Types.ObjectId().toString(),
                sender: toId,
                receiver: userId,
                content: welcomeText,
                timeStamp: new Date().toISOString(),
              }
            };
            sendJSON(ws, welcomemessage);
            if (receiverWs && receiverWs.readyState == WebSocket.OPEN){
              sendJSON(receiverWs,welcomemessage);
            }
            await postMessages(userId, toId, content);
            await postMessages(toId, userId, welcomeText);
            
          }

        if (content.includes("@AI") ||content.includes("@Ai") || content.includes("@aI") || content.includes("@ai")){

          
          const cleanContent = content.replace(/@ai/gi,"").trim();
            
          const seller = await User.findById(toId);
          const buyer = true;
          if (buyer){
            recommend = await getRecommendations(content, seller.name);
          }

          const response = {
            type: "message",
            message: {
              id: new mongoose.Types.ObjectId().toString(),
              sender: toId,
              receiver: userId,
              content: recommend.answer,
              timeStamp: new Date().toISOString()
            }
          }

          sendJSON(ws, response);
          if (receiverWs && receiverWs.readyState == WebSocket.OPEN){
            sendJSON(receiverWs,response);
          }
          await postMessages(userId, toId, content);
          await postMessages(toId, userId, recommend.answer);
          return;
        }

        // 3️⃣ Send message to receiver (if online)
        // 4️⃣ Send back confirmation to sender

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
    const PORT = process.env.PORT || 10000;
    server.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });
