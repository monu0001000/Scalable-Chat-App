import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "./hooks/useWebSocket.js";
import JoinScreen    from "./components/JoinScreen.jsx";
import Sidebar       from "./components/Sidebar.jsx";
import MessageList   from "./components/MessageList.jsx";
import MessageInput  from "./components/MessageInput.jsx";
import ConnectionBadge from "./components/ConnectionBadge.jsx";

const DEMO_MESSAGES = [
  { id: "d1", userId: "bot1", username: "Alice",  color: "#4ECDC4", text: "Hey! Welcome to NexChat 👋",                   timestamp: Date.now() - 120_000 },
  { id: "d2", userId: "bot2", username: "Bob",    color: "#FF6B6B", text: "Connect your server to go live in real-time!", timestamp: Date.now() -  60_000 },
  { id: "d3", userId: "bot1", username: "Alice",  color: "#4ECDC4", text: "Try typing a message below ✨",                 timestamp: Date.now() -  15_000 },
];

export default function App() {
  const [joined,       setJoined]       = useState(false);
  const [username,     setUsername]     = useState("");
  const [myColor,      setMyColor]      = useState("#96CEB4");
  const [myId,         setMyId]         = useState(null);
  const [currentRoom,  setCurrentRoom]  = useState("general");
  const [messages,     setMessages]     = useState(DEMO_MESSAGES);
  const [onlineUsers,  setOnlineUsers]  = useState([]);
  const [typingUsers,  setTypingUsers]  = useState([]);

  const { connect, send, status, setConnected, on } = useWebSocket();

  // ── Register WS event handlers ─────────────────────────────────────────────
  useEffect(() => {
    on("connected", (msg) => {
      setMyId(msg.userId);
      setMyColor(msg.color);
    });

    on("joined", (msg) => {
      setConnected();
      setOnlineUsers(msg.users || []);
      setMessages([]);       // clear on room entry
    });

    on("user_joined", (msg) => {
      setOnlineUsers(msg.users || []);
      setMessages(prev => [...prev, {
        id: `sys-${Date.now()}`, type: "system",
        text: `${msg.username} joined the room`,
        timestamp: msg.timestamp,
      }]);
    });

    on("user_left", (msg) => {
      setOnlineUsers(msg.users || []);
      setMessages(prev => [...prev, {
        id: `sys-${Date.now()}`, type: "system",
        text: `${msg.username} left`,
        timestamp: msg.timestamp,
      }]);
    });

    on("message", (msg) => {
      setMessages(prev => [...prev, msg]);
      setTypingUsers(prev => prev.filter(u => u !== msg.username));
    });

    on("typing", (msg) => {
      setTypingUsers(prev => {
        if (msg.isTyping && !prev.includes(msg.username))
          return [...prev, msg.username];
        if (!msg.isTyping)
          return prev.filter(u => u !== msg.username);
        return prev;
      });
    });
  }, [on, setConnected]);

  // ── Join / connect ─────────────────────────────────────────────────────────
  const handleJoin = useCallback(({ username: user, room, wsUrl }) => {
    setUsername(user);
    setCurrentRoom(room);
    setJoined(true);

    connect(wsUrl);

    // Wait for "connected" event then send join
    const waitAndJoin = () => {
      // We hook into the connected event listener already registered above,
      // but we also need to send "join" after the socket opens.
      // We piggy-back on the ws onopen via a small polling hack:
      let attempts = 0;
      const interval = setInterval(() => {
        const sent = send({ type: "join", username: user, room });
        if (sent || ++attempts > 20) clearInterval(interval);
      }, 200);
    };
    setTimeout(waitAndJoin, 300);
  }, [connect, send]);

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSend = useCallback((text) => {
    const sent = send({ type: "message", text });
    if (!sent) {
      // Demo / offline echo
      setMessages(prev => [...prev, {
        id: `local-${Date.now()}`,
        userId: myId ?? "me",
        username, color: myColor,
        text, timestamp: Date.now(),
        room: currentRoom, isOwn: true,
      }]);
    }
  }, [send, myId, username, myColor, currentRoom]);

  // ── Typing ──────────────────────────────────────────────────────────────────
  const handleTyping = useCallback((isTyping) => {
    send({ type: "typing", isTyping });
  }, [send]);

  // ── Switch room ─────────────────────────────────────────────────────────────
  const handleSwitchRoom = useCallback((room) => {
    if (room === currentRoom) return;
    setCurrentRoom(room);
    setMessages([]);
    setOnlineUsers([]);
    setTypingUsers([]);
    send({ type: "join", username, room });
  }, [currentRoom, send, username]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (!joined) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        padding: 20,
      }}>
        <JoinScreen onJoin={handleJoin} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        width: "100%", maxWidth: 900,
        height: "90vh", maxHeight: 700,
        background: "#111118", border: "1px solid #1e1e2e",
        borderRadius: 16, display: "flex", overflow: "hidden",
        boxShadow: "0 0 80px #4ECDC406",
      }}>

        <Sidebar
          currentRoom={currentRoom}
          onSwitchRoom={handleSwitchRoom}
          username={username}
          myColor={myColor}
          status={status}
          onlineUsers={onlineUsers}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div style={{
            padding: "0 20px", height: 54,
            borderBottom: "1px solid #1e1e2e",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", flexShrink: 0,
          }}>
            <span style={{ fontSize: 16, color: "#4ECDC4", fontWeight: 700 }}>
              # {currentRoom}
            </span>
            <ConnectionBadge status={status} />
          </div>

          <MessageList
            messages={messages}
            myId={myId}
            typingUsers={typingUsers}
          />

          <MessageInput
            onSend={handleSend}
            onTyping={handleTyping}
            disabled={false}
          />
        </div>
      </div>
    </div>
  );
}
