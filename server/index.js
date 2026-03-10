const WebSocket = require("ws");
const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 8080;

// ─── HTTP server (health check + CORS) ───────────────────────────────────────
const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      clients: wss.clients.size,
      rooms: Array.from(rooms.keys()),
      uptime: Math.floor(process.uptime()),
    }));
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("NexChat WebSocket Server — connect via ws://");
  }
});

// ─── WebSocket server ─────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ server });

// State
const rooms = new Map();   // roomId → Set<ws>
const users = new Map();   // ws     → { id, username, room, color }

const USER_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#BB8FCE", "#85C1E9", "#82E0AA", "#F0B27A",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const genId = () => crypto.randomBytes(4).toString("hex");

const colorFor = (id) =>
  USER_COLORS[parseInt(id.slice(0, 2), 16) % USER_COLORS.length];

const send = (ws, payload) => {
  if (ws.readyState === WebSocket.OPEN)
    ws.send(JSON.stringify(payload));
};

const broadcast = (roomId, payload, exclude = null) => {
  const clients = rooms.get(roomId);
  if (!clients) return;
  const data = JSON.stringify(payload);
  clients.forEach((ws) => {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN)
      ws.send(data);
  });
};

const roomUsers = (roomId) =>
  Array.from(rooms.get(roomId) || [])
    .map((ws) => users.get(ws))
    .filter(Boolean)
    .map(({ id, username, color }) => ({ id, username, color }));

// ─── Connection handler ───────────────────────────────────────────────────────
wss.on("connection", (ws, req) => {
  const userId = genId();
  const userColor = colorFor(userId);
  const ip = req.socket.remoteAddress;

  console.log(`[+] ${userId} connected  (${ip})`);

  // Greet the client with its assigned ID
  send(ws, { type: "connected", userId, color: userColor, timestamp: Date.now() });

  // ── Message router ──────────────────────────────────────────────────────────
  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw); }
    catch { return send(ws, { type: "error", message: "Invalid JSON" }); }

    const user = users.get(ws);

    switch (msg.type) {

      // ── JOIN ──────────────────────────────────────────────────────────────
      case "join": {
        const username = String(msg.username || "Anonymous").slice(0, 24).trim();
        const roomId   = String(msg.room || "general")
          .slice(0, 32).trim().toLowerCase().replace(/\s+/g, "-") || "general";

        // Leave current room
        if (user) {
          const prev = rooms.get(user.room);
          if (prev) {
            prev.delete(ws);
            if (prev.size === 0) rooms.delete(user.room);
            else broadcast(user.room, {
              type: "user_left", userId: user.id, username: user.username,
              room: user.room, users: roomUsers(user.room), timestamp: Date.now(),
            });
          }
        }

        // Enter new room
        if (!rooms.has(roomId)) rooms.set(roomId, new Set());
        rooms.get(roomId).add(ws);
        users.set(ws, { id: userId, username, room: roomId, color: userColor });

        send(ws, {
          type: "joined", userId, username, room: roomId,
          color: userColor, users: roomUsers(roomId), timestamp: Date.now(),
        });

        broadcast(roomId, {
          type: "user_joined", userId, username, room: roomId,
          color: userColor, users: roomUsers(roomId), timestamp: Date.now(),
        }, ws);

        console.log(`    ↳ ${username} (${userId}) joined #${roomId}`);
        break;
      }

      // ── MESSAGE ───────────────────────────────────────────────────────────
      case "message": {
        if (!user) return send(ws, { type: "error", message: "Join a room first" });
        const text = String(msg.text || "").slice(0, 2000).trim();
        if (!text) return;

        const out = {
          type: "message", id: genId(),
          userId: user.id, username: user.username,
          color: user.color, room: user.room,
          text, timestamp: Date.now(),
        };

        send(ws, out);            // echo back to sender
        broadcast(user.room, out, ws);

        console.log(`[msg] #${user.room} ${user.username}: ${text.slice(0, 60)}`);
        break;
      }

      // ── TYPING ────────────────────────────────────────────────────────────
      case "typing": {
        if (!user) return;
        broadcast(user.room, {
          type: "typing", userId: user.id, username: user.username,
          isTyping: !!msg.isTyping, timestamp: Date.now(),
        }, ws);
        break;
      }

      // ── LIST ROOMS ────────────────────────────────────────────────────────
      case "list_rooms": {
        send(ws, {
          type: "room_list",
          rooms: Array.from(rooms.entries()).map(([id, s]) => ({ id, count: s.size })),
        });
        break;
      }

      default:
        send(ws, { type: "error", message: `Unknown type: ${msg.type}` });
    }
  });

  // ── Disconnect ──────────────────────────────────────────────────────────────
  ws.on("close", () => {
    const user = users.get(ws);
    if (user) {
      const room = rooms.get(user.room);
      if (room) {
        room.delete(ws);
        if (room.size === 0) rooms.delete(user.room);
        else broadcast(user.room, {
          type: "user_left", userId: user.id, username: user.username,
          room: user.room, users: roomUsers(user.room), timestamp: Date.now(),
        });
      }
      users.delete(ws);
      console.log(`[-] ${user.username} (${user.id}) disconnected`);
    }
  });

  ws.on("error", (err) =>
    console.error(`[!] WS error (${userId}): ${err.message}`)
  );
});

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log("╔══════════════════════════════════════╗");
  console.log(`║  NexChat WebSocket Server            ║`);
  console.log(`║  ws://localhost:${PORT}              ║`);
  console.log(`║  http://localhost:${PORT}/health     ║`);
  console.log("╚══════════════════════════════════════╝");
});
