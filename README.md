# ◈ NexChat —  WebSocket Chat App

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



### Production Checklist

- [ ] Redis pub/sub for multi-instance broadcasting
- [ ] JWT authentication on WebSocket handshake
- [ ] Rate limiting per connection (e.g., 10 msg/sec)
- [ ] Message persistence (PostgreSQL or MongoDB)
- [ ] Reconnect with exponential backoff on client
