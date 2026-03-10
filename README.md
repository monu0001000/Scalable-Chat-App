# ◈ NexChat — Scalable WebSocket Chat App

Real-time multi-room chat. Node.js WebSocket server + React/Vite frontend.

---

## 📁 Folder Structure

```
nexchat/
├── server/
│   ├── index.js          ← WebSocket + HTTP server
│   └── package.json
│
└── client/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx                     ← React entry point
        ├── App.jsx                      ← Root component + WS logic
        ├── index.css                    ← Global styles + animations
        ├── hooks/
        │   └── useWebSocket.js          ← Reusable WS hook
        ├── components/
        │   ├── Avatar.jsx
        │   ├── ConnectionBadge.jsx
        │   ├── JoinScreen.jsx
        │   ├── MessageBubble.jsx
        │   ├── MessageInput.jsx
        │   ├── MessageList.jsx
        │   └── Sidebar.jsx
        └── utils/
            └── helpers.js
```

---

## 🚀 Setup & Commands

### Terminal 1 — Start the Server

```bash
cd nexchat/server
npm install
npm start
```

Server starts at → **ws://localhost:8080**
Health check   → **http://localhost:8080/health**

For auto-reload during development:

```bash
npm run dev        # uses nodemon
```

---

### Terminal 2 — Start the Frontend

```bash
cd nexchat/client
npm install
npm run dev
```

Frontend runs at → **http://localhost:3000**

---

### Build for Production

```bash
cd nexchat/client
npm run build      # outputs to client/dist/
npm run preview    # preview the production build
```

---

## ✨ Features

- **Multi-room** — rooms auto-create and destroy
- **Live presence** — real-time online user list
- **Typing indicators** — animated dots show who's typing
- **Message grouping** — consecutive messages are visually grouped
- **User colors** — each user gets a deterministic unique color
- **Demo mode** — works in the UI even without a server running
- **Clean disconnects** — user_left events when someone closes the tab

---

## 📡 WebSocket Protocol

### Client → Server

```jsonc
// Join a room
{ "type": "join", "username": "Alice", "room": "general" }

// Send a message
{ "type": "message", "text": "Hello!" }

// Typing indicator
{ "type": "typing", "isTyping": true }

// List active rooms
{ "type": "list_rooms" }
```

### Server → Client

```jsonc
{ "type": "connected",   "userId": "a1b2",  "color": "#4ECDC4" }
{ "type": "joined",      "userId": "...",   "users": [...] }
{ "type": "user_joined", "username": "...", "users": [...] }
{ "type": "user_left",   "username": "...", "users": [...] }
{ "type": "message",     "id": "...",       "text": "...", "username": "...", "color": "...", "timestamp": 0 }
{ "type": "typing",      "username": "...", "isTyping": true }
{ "type": "room_list",   "rooms": [{ "id": "general", "count": 3 }] }
{ "type": "error",       "message": "..." }
```

---

## 📈 Scaling to Production

### Add Redis for Horizontal Scaling

Run multiple server instances behind a load balancer using Redis pub/sub:

```bash
npm install ioredis
```

```js
// server/index.js — swap broadcast() with this:
const Redis = require("ioredis");
const pub = new Redis(process.env.REDIS_URL);
const sub = new Redis(process.env.REDIS_URL);

function broadcast(roomId, payload, exclude = null) {
  pub.publish(`room:${roomId}`, JSON.stringify(payload));
}

sub.psubscribe("room:*");
sub.on("pmessage", (_, channel, data) => {
  const roomId = channel.replace("room:", "");
  (rooms.get(roomId) || new Set()).forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  });
});
```

### Nginx Reverse Proxy Config

```nginx
location /ws {
  proxy_pass         http://localhost:8080;
  proxy_http_version 1.1;
  proxy_set_header   Upgrade    $http_upgrade;
  proxy_set_header   Connection "Upgrade";
  proxy_set_header   Host       $host;
}
```

### Production Checklist

- [ ] Redis pub/sub for multi-instance broadcasting
- [ ] JWT authentication on WebSocket handshake
- [ ] Rate limiting per connection (e.g., 10 msg/sec)
- [ ] Message persistence (PostgreSQL or MongoDB)
- [ ] Nginx reverse proxy with SSL termination
- [ ] PM2 or Docker for process management
- [ ] Reconnect with exponential backoff on client
