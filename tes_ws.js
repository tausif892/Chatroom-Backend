const WebSocket = require("ws");
const jwt = require("jsonwebtoken");

const tokenMoham = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjE2NWI0Njg3MGY2MzJhMjQ1MTQ3MiIsInVzZXJuYW1lIjoiYWxpY2UiLCJlbWFpbElkIjoibW9hbW1hZC50YXVzaTIwMDVAZ21haWwuY29tIiwicGhvbmVOdW1iZXIiOiIxODY3NDYwMjQiLCJpYXQiOjE3NjA2NTA2ODQsImV4cCI6MTc2MTI1NTQ4NH0.15dgagFbOQPACW50RJuVIAeeHY3NkDvVSxXFOz_LKU4";
const tokenTausif = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjE2NTlmNjg3MGY2MzJhMjQ1MTQ2ZiIsInVzZXJuYW1lIjoidGF1c2lmIiwiZW1haWxJZCI6Im1vaGFtbWFkLnRhdXNpMjAwNUBnbWFpbC5jb20iLCJwaG9uZU51bWJlciI6Ijk4Njc0NjAyNCIsImlhdCI6MTc2MDY1MDcxMiwiZXhwIjoxNzYxMjU1NTEyfQ.X_xSjnPdoOT4YElONn9A7JliQS_JvPQGucAcySMcBqI";

const wsMoham = new WebSocket(`wss://laevo-leonora-unslaughtered.ngrok-free.dev?token=${tokenMoham}`);
const wsTausif = new WebSocket(`wss://laevo-leonora-unslaughtered.ngrok-free.dev?token=${tokenTausif}`);

function sendJSON(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

console.log(`Alice id ${jwt.decode(tokenMoham).id}`);
console.log(`Tausif id ${jwt.decode(tokenTausif).id}`);

wsMoham.on("open", () => {
  console.log("Mohammad connected ✅");

  // Wait a bit to ensure both sockets are open
  setTimeout(() => {
    sendJSON(wsMoham, {
      type: "message",
      to: jwt.decode(tokenTausif).id,
      content: "Hello Tausif 👋"
    });
  }, 1000);
});

wsMoham.on("message", (msg) => {
  console.log("Mohammad received:", msg.toString());
});

wsMoham.on("close", () => {
  console.log("Mohammad closed connection ❌");
});

wsMoham.on("error", (err) => {
  console.log("Mohammad faced error ❗", err.message);
});

wsTausif.on("open", () => {
  console.log("Tausif connected ✅");

  // Wait a bit so both sides are ready
  setTimeout(() => {
    sendJSON(wsTausif, {
      type: "message",
      to: jwt.decode(tokenMoham).id,
      content: "Hello Alice 👋"
    });
  }, 2000);

  // Close both after 6 seconds
  setTimeout(() => {
    wsTausif.close();
    wsMoham.close();
  }, 6000);
});

wsTausif.on("message", (msg) => {
  console.log("Tausif received:", msg.toString());
});

wsTausif.on("close", () => {
  console.log("Tausif closed connection ❌");
  process.exit(0);
});

wsTausif.on("error", (err) => {
  console.log("Tausif faced error ❗", err.message);
});
