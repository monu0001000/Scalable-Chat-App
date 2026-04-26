const Message = require("../models/Message");
const { genId } = require("../utils/helpers");
const { publish, subscribeRoom, unsubscribeRoom } = require("../redis/pubsub");
const {
  send, roomUsers, addToRoom, removeFromRoom,
  hasRoom, isRoomEmpty, users,
} = require("./rooms");

const HISTORY_LIMIT = 50;

// ── helpers ───────────────────────────────────────────────────────────────────
// .lean() returns reactions as a plain object OR a Map depending on Mongoose version.
// Normalise to a plain object safely either way.
const normaliseReactions = (raw) => {
  if (!raw) return {};
  if (raw instanceof Map) return Object.fromEntries(raw);
  if (typeof raw === "object") return raw;
  return {};
};

// ── JOIN ──────────────────────────────────────────────────────────────────────
const handleJoin = async (ws, msg, identity) => {
  const { userId, username, userColor } = identity;

  const roomId = String(msg.room || "general")
    .slice(0, 200).trim().toLowerCase().replace(/\s+/g, "-") || "general";

  // Leave previous room if already in one
  const currentUser = users.get(ws);
  if (currentUser) {
    const wasEmpty = isRoomEmpty(currentUser.room);
    removeFromRoom(ws);

    if (!isRoomEmpty(currentUser.room)) {
      publish(currentUser.room, {
        type: "user_left",
        userId: currentUser.id, username: currentUser.username,
        room: currentUser.room, users: roomUsers(currentUser.room),
        timestamp: Date.now(),
      });
    } else if (!wasEmpty) {
      unsubscribeRoom(currentUser.room);
    }
  }

  // Subscribe to Redis channel if this is the first local client in the room
  const isNewRoom = !hasRoom(roomId);
  addToRoom(ws, roomId, { id: userId, username, room: roomId, color: userColor });
  if (isNewRoom) subscribeRoom(roomId);

  // 1. Confirm join to the connecting client
  send(ws, {
    type: "joined", userId, username, room: roomId,
    color: userColor, users: roomUsers(roomId), timestamp: Date.now(),
  });

  // 2. Send message history
  const history = await Message
    .find({ room: roomId })
    .sort({ timestamp: -1 })
    .limit(HISTORY_LIMIT)
    .lean();

  if (history.length > 0) {
    send(ws, {
      type: "history", room: roomId,
      messages: history.reverse().map(m => ({
        type:      "message",
        id:        m.msgId,
        msgId:     m.msgId,
        room:      m.room,
        userId:    m.userId,
        username:  m.username,
        color:     m.color,
        text:      m.text,
        imageUrl:  m.imageUrl || "",
        reactions: normaliseReactions(m.reactions),
        timestamp: m.timestamp,
      })),
    });
  }

  // 3. Notify everyone else in the room
  publish(roomId, {
    type: "user_joined", userId, username, room: roomId,
    color: userColor, users: roomUsers(roomId),
    timestamp: Date.now(), _senderId: userId,
  });

  console.log(`    ↳ ${username} joined #${roomId} — sent ${history.length} history msgs`);
  
  console.log(`[join] ${username} joined room: "${roomId}"`);
};

// ── MESSAGE ───────────────────────────────────────────────────────────────────
const handleMessage = async (ws, msg) => {
  const user = users.get(ws);
  if (!user) return send(ws, { type: "error", message: "Join a room first" });

  const text     = String(msg.text     || "").slice(0, 2000).trim();
  const imageUrl = String(msg.imageUrl || "").slice(0, 500);
  if (!text && !imageUrl) return;

  const id = genId();
  const out = {
    type:      "message",
    id,
    msgId:     id,
    userId:    user.id,
    username:  user.username,
    color:     user.color,
    room:      user.room,
    text,
    imageUrl,
    reactions: {},
    timestamp: Date.now(),
    _senderId: user.id,
  };

  // Persist to MongoDB
  await Message.create({
    msgId:     out.id,
    room:      out.room,
    userId:    out.userId,
    username:  out.username,
    color:     out.color,
    text:      out.text,
    imageUrl:  out.imageUrl,
    timestamp: out.timestamp,
  }).catch(e => console.error("[mongo] save error:", e.message));

  // Echo back to sender immediately, fan-out to everyone else via Redis
  send(ws, out);
  publish(user.room, out);

  console.log(`[msg] #${user.room} ${user.username}: ${text.slice(0, 60)}`);
};

// ── TYPING ────────────────────────────────────────────────────────────────────
const handleTyping = (ws, msg) => {
  const user = users.get(ws);
  if (!user) return;

  publish(user.room, {
    type:      "typing",
    userId:    user.id,
    username:  user.username,
    isTyping:  !!msg.isTyping,
    timestamp: Date.now(),
    _senderId: user.id,
  });
};

// ── LIST ROOMS ────────────────────────────────────────────────────────────────
const handleListRooms = (ws, rooms) => {
  send(ws, {
    type:  "room_list",
    rooms: Array.from(rooms.entries()).map(([id, s]) => ({ id, count: s.size })),
  });
};

// ── DISCONNECT ────────────────────────────────────────────────────────────────
const handleDisconnect = (ws) => {
  const user = users.get(ws);
  if (!user) return;

  const wasEmpty = isRoomEmpty(user.room);
  removeFromRoom(ws);

  if (!isRoomEmpty(user.room)) {
    publish(user.room, {
      type:      "user_left",
      userId:    user.id,
      username:  user.username,
      room:      user.room,
      users:     roomUsers(user.room),
      timestamp: Date.now(),
    });
  } else if (!wasEmpty) {
    unsubscribeRoom(user.room);
  }

  console.log(`[-] ${user.username} disconnected`);
};

module.exports = {
  handleJoin,
  handleMessage,
  handleTyping,
  handleListRooms,
  handleDisconnect,
}; 
