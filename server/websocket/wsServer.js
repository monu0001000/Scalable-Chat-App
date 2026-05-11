const WebSocket = require("ws");
const jwt       = require("jsonwebtoken");
const url       = require("url");

const { send, rooms } = require("./rooms");

const {
  handleJoin,
  handleMessage,
  handleTyping,
  handleListRooms,
  handleDisconnect,
} = require("./handlers");

const initWsServer = (httpServer) => {
  const wss = new WebSocket.Server({ server: httpServer });

 
  wss.on("connection", (ws, req) => {
    const { query } = url.parse(req.url, true);
    const token = query.token;

    if (!token) {
      send(ws, { type: "error", message: "Authentication required" });
      return ws.close(4001, "No token");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      send(ws, { type: "error", message: "Invalid or expired token" });
      return ws.close(4001, "Invalid token");
    }

    const identity = {
      userId:    decoded.userId,
      username:  decoded.username,
      userColor: decoded.color,
    };

    const ip = req.socket.remoteAddress;
    console.log(`[+] ${identity.username} (${identity.userId}) connected (${ip})`);

    send(ws, {
      type: "connected",
      userId:    identity.userId,
      username:  identity.username,
      color:     identity.userColor,
      timestamp: Date.now(),
    });

    ws.on("message", async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return send(ws, { type: "error", message: "Invalid JSON" });
      }

      switch (msg.type) {
        case "join":
          await handleJoin(ws, msg, identity);
          break;

        case "message":
          await handleMessage(ws, msg);
          break;

        case "typing":
          handleTyping(ws, msg);
          break;

        case "list_rooms":
          handleListRooms(ws, rooms);
          break;

        default:
          send(ws, { type: "error", message: `Unknown type: ${msg.type}` });
      }
    });

    ws.on("close", () => handleDisconnect(ws));

    ws.on("error", (err) => {
      console.error(`[!] WS error (${identity.userId}): ${err.message}`);
    });
  });

  return wss;
};

module.exports = initWsServer;