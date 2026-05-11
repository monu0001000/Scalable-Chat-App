const WebSocket = require("ws");

// roomId → Set<ws>
const rooms = new Map();

// ws → { id, username, room, color }
const users = new Map();

const send = (ws, payload) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};

const roomUsers = (roomId) =>
  Array.from(rooms.get(roomId) || [])
    .map((ws) => users.get(ws))
    .filter(Boolean)
    .map(({ id, username, color }) => ({ id, username, color }));

const deliverLocally = (roomId, payload, excludeUserId = null) => {
  const clients = rooms.get(roomId);
  if (!clients) return;

  const data = JSON.stringify(payload);

  clients.forEach((ws) => {
    const u = users.get(ws);

  
    if (u && u.id === excludeUserId) return;

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
};

const addToRoom = (ws, roomId, userInfo) => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }

  rooms.get(roomId).add(ws);
  users.set(ws, userInfo);
};

const removeFromRoom = (ws) => {
  const user = users.get(ws);
  if (!user) return null;

  const room = rooms.get(user.room);

  if (room) {
    room.delete(ws);
    if (room.size === 0) {
      rooms.delete(user.room);
    }
  }

  users.delete(ws);
  return user;
};

const hasRoom = (roomId) => rooms.has(roomId);

const isRoomEmpty = (roomId) =>
  !rooms.has(roomId) || rooms.get(roomId).size === 0;

// 🔥 FIXED (your version was wrong key)
const getSocketByUserId = (userId) => {
  for (const [ws, data] of users.entries()) {
    if (data.id === userId) return ws;
  }
  return null;
};

module.exports = {
  rooms,
  users,
  send,
  roomUsers,
  deliverLocally,
  addToRoom,
  removeFromRoom,
  hasRoom,
  isRoomEmpty,
  getSocketByUserId,
};