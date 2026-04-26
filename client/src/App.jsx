import { useState, useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "./hooks/useWebSocket.js";
import JoinScreen      from "./components/JoinScreen.jsx";
import Sidebar         from "./components/Sidebar.jsx";
import ServerRail      from "./components/ServerRail.jsx";
import ServerSettings  from "./components/ServerSettings.jsx";
import MessageList     from "./components/MessageList.jsx";
import MessageInput    from "./components/MessageInput.jsx";
import ConnectionBadge from "./components/ConnectionBadge.jsx";
import ProfileCard     from "./components/ProfileCard.jsx";

export default function App() {
  const [joined,        setJoined]        = useState(false);
  const [username,      setUsername]      = useState("");
  const [myColor,       setMyColor]       = useState("#96CEB4");
  const [myId,          setMyId]          = useState(null);
  const myIdRef = useRef(null); // always-current ref so callbacks don't go stale
  const [myAvatarUrl,   setMyAvatarUrl]   = useState("");
  const [currentRoom,   setCurrentRoom]   = useState("general");
  const [dmPartner,     setDmPartner]     = useState("");
  const [messages,      setMessages]      = useState([]);
  const [onlineUsers,   setOnlineUsers]   = useState([]);
  const [typingUsers,   setTypingUsers]   = useState([]);
  const [profileTarget, setProfileTarget] = useState(null);
  const [friends,       setFriends]       = useState([]);
  const [friendRequests,setFriendRequests]= useState([]);
  const [servers,       setServers]       = useState([]);
  const [activeServer,  setActiveServer]  = useState(null);
  const [showServerSettings, setShowServerSettings] = useState(false);

  const { connect, send, status, setConnected, on } = useWebSocket();

  // Keep ref in sync with state
  useEffect(() => { myIdRef.current = myId; }, [myId]);

  // ── WS event handlers ──────────────────────────────────────────────────────
  useEffect(() => {
    on("connected", (msg) => {
      setMyId(msg.userId);
      myIdRef.current = msg.userId;
      setMyColor(msg.color);
      localStorage.setItem("nexchat_userid", msg.userId);
    });

    on("joined", (msg) => {
      setConnected();
      setOnlineUsers(msg.users || []);
      setMessages([]);
    });

    on("history", (msg) => {
      setMessages((msg.messages || []).map(m => ({ ...m, isHistory: true })));
    });

    on("user_joined", (msg) => {
      setOnlineUsers(msg.users || []);
      setMessages(prev => [...prev, {
        id: `sys-${Date.now()}`, type: "system",
        text: `${msg.username} joined the room`, timestamp: msg.timestamp,
      }]);
    });

    on("user_left", (msg) => {
      setOnlineUsers(msg.users || []);
      setMessages(prev => [...prev, {
        id: `sys-${Date.now()}`, type: "system",
        text: `${msg.username} left`, timestamp: msg.timestamp,
      }]);
    });

    on("message", (msg) => {
      setMessages(prev => [...prev, msg]);
      setTypingUsers(prev => prev.filter(u => u !== msg.username));

      if (
        document.hidden &&
        msg.username !== username &&
        Notification.permission === "granted"
      ) {
        const notification = new Notification(msg.username, {
          body: msg.text?.length > 80 ? msg.text.slice(0, 80) + "…" : msg.text,
          icon: msg.avatarUrl || `https://ui-avatars.com/api/?name=${msg.username}&background=4ECDC4&color=0a0a0f`,
          tag: msg.room,
        });
        notification.onclick = () => { window.focus(); notification.close(); };
      }
    });

    on("typing", (msg) => {
      setTypingUsers(prev => {
        if (msg.isTyping && !prev.includes(msg.username)) return [...prev, msg.username];
        if (!msg.isTyping) return prev.filter(u => u !== msg.username);
        return prev;
      });
      if (msg.isTyping) {
        clearTimeout(window[`typing_${msg.userId}`]);
        window[`typing_${msg.userId}`] = setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u !== msg.username));
        }, 3000);
      }
    });

    on("friend_request", (msg) => {
      setFriendRequests(prev => [...prev, { from: msg.from, sentAt: msg.timestamp }]);
    });

    on("reaction", (msg) => {
      setMessages(prev => prev.map(m =>
        (m.msgId || m.id) === msg.msgId
          ? { ...m, reactions: msg.reactions }
          : m
      ));
    });

    on("error", (msg) => {
      if (msg.message?.includes("token") || msg.message?.includes("Authentication")) {
        localStorage.removeItem("nexchat_token");
        localStorage.removeItem("nexchat_username");
        localStorage.removeItem("nexchat_color");
        setJoined(false);
      }
    });

  }, [on, setConnected, username]);

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const fetchFriends = useCallback(async () => {
    const token = localStorage.getItem("nexchat_token");
    if (!token) return;
    const [f, r] = await Promise.all([
      fetch("http://localhost:8080/friends",          { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("http://localhost:8080/friends/requests", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]);
    setFriends(f.friends || []);
    setFriendRequests(r.requests || []);
  }, []);

  const fetchServers = useCallback(async () => {
    const token = localStorage.getItem("nexchat_token");
    if (!token) return;
    const res  = await fetch("http://localhost:8080/servers", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setServers(data.servers || []);
  }, []);

  // ── Join ───────────────────────────────────────────────────────────────────
  const handleJoin = useCallback(({ username: user, color, token, room, wsUrl }) => {
    setUsername(user);
    setMyColor(color);
    setCurrentRoom(room);
    setJoined(true);

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    fetch(`http://localhost:8080/users/${user}`)
      .then(r => r.json())
      .then(data => setMyAvatarUrl(data.avatarUrl || ""))
      .catch(() => {});

    fetchFriends();
    fetchServers();

    const wsWithToken = `${wsUrl}?token=${encodeURIComponent(token)}`;
    connect(wsWithToken);

    const waitAndJoin = () => {
      let attempts = 0;
      const interval = setInterval(() => {
        const sent = send({ type: "join", room });
        if (sent || ++attempts > 20) clearInterval(interval);
      }, 200);
    };
    setTimeout(waitAndJoin, 300);
  }, [connect, send, fetchFriends, fetchServers]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    localStorage.removeItem("nexchat_token");
    localStorage.removeItem("nexchat_username");
    localStorage.removeItem("nexchat_color");
    localStorage.removeItem("nexchat_userid");
    setJoined(false);
    setMessages([]);
    setOnlineUsers([]);
    setTypingUsers([]);
    setMyAvatarUrl("");
    setServers([]);
    setActiveServer(null);
    setDmPartner("");
  }, []);

  // ── Message actions ────────────────────────────────────────────────────────
  const handleSend = useCallback((text, imageUrl) => {
    send({ type: "message", text, imageUrl: imageUrl || "" });
  }, [send]);

  const handleTyping = useCallback((isTyping) => send({ type: "typing", isTyping }), [send]);

  const handleReact = useCallback(async (msgId, emoji) => {
    const token = localStorage.getItem("nexchat_token");
    await fetch(`http://localhost:8080/messages/${msgId}/react`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ emoji }),
    });
  }, []);

  const handleSwitchRoom = useCallback((room) => {
    if (room === currentRoom) return;
    setCurrentRoom(room);
    setMessages([]);
    setOnlineUsers([]);
    setTypingUsers([]);
    send({ type: "join", room });
  }, [currentRoom, send]);

  // Uses ref so it's never stale regardless of when myId state updates
  const handleOpenDM = useCallback((friend) => {
    const id = myIdRef.current;
    if (!id) return;
    setActiveServer(null);
    setDmPartner(friend.username);
    const ids = [id, String(friend.userId)].sort();
    const room = `dm_${ids[0]}_${ids[1]}`;
    console.log("[DM] myId:", id, "friendId:", friend.userId, "room:", room);
    setCurrentRoom(room);
    setMessages([]);
    setOnlineUsers([]);
    setTypingUsers([]);
    send({ type: "join", room });
  }, [send]);

  if (!joined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <JoinScreen onJoin={handleJoin} />
      </div>
    );
  }

  const roomLabel = activeServer
    ? currentRoom.split("_").slice(2).join("_")
    : currentRoom.startsWith("dm_")
    ? dmPartner || "Direct Message"
    : currentRoom;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{
        width: "100%", maxWidth: 960, height: "90vh", maxHeight: 700,
        background: "#111118", border: "1px solid #1e1e2e",
        borderRadius: 16, display: "flex", overflow: "hidden",
        boxShadow: "0 0 80px #4ECDC406",
      }}>

        <ServerRail
          servers={servers}
          activeServerId={activeServer?._id}
          isGlobal={!activeServer}
          onSelectGlobal={() => {
            setActiveServer(null);
            setDmPartner("");
            handleSwitchRoom("general");
          }}
          onSelectServer={(s) => {
            setActiveServer(s);
            setDmPartner("");
            const firstChannel = s.channels?.[0]?.name || "general";
            handleSwitchRoom(`server_${s._id}_${firstChannel}`);
          }}
          onServerCreated={(s) => {
            setServers(prev => [...prev, s]);
            setActiveServer(s);
            setDmPartner("");
            handleSwitchRoom(`server_${s._id}_general`);
          }}
        />

        <Sidebar
          currentRoom={currentRoom}
          onSwitchRoom={handleSwitchRoom}
          username={username}
          myColor={myColor}
          myAvatarUrl={myAvatarUrl}
          status={status}
          onlineUsers={activeServer ? [] : onlineUsers}
          onLogout={handleLogout}
          onOpenProfile={setProfileTarget}
          friends={friends}
          friendRequests={friendRequests}
          onOpenDM={handleOpenDM}
          onFriendsUpdate={fetchFriends}
          activeServer={activeServer}
          onServerSettings={() => setShowServerSettings(true)}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{
            padding: "0 20px", height: 54,
            borderBottom: "1px solid #1e1e2e",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", flexShrink: 0,
          }}>
            <span style={{ fontSize: 16, color: "#4ECDC4", fontWeight: 700 }}>
              # {roomLabel}
            </span>
            <ConnectionBadge status={status} />
          </div>

          <MessageList
            messages={messages}
            myId={myId}
            typingUsers={typingUsers}
            onOpenProfile={setProfileTarget}
            onReact={handleReact}
          />
          <MessageInput onSend={handleSend} onTyping={handleTyping} disabled={false} />
        </div>
      </div>

      {profileTarget && (
        <ProfileCard
          username={profileTarget}
          myUsername={username}
          onClose={() => setProfileTarget(null)}
          onAvatarUpdate={(url) => setMyAvatarUrl(url)}
          onOpenDM={(friend) => {
            setProfileTarget(null);
            handleOpenDM(friend);
          }}
        />
      )}

      {showServerSettings && activeServer && (
        <ServerSettings
          server={activeServer}
          onClose={() => setShowServerSettings(false)}
          onUpdated={async () => {
            await fetchServers();
            setServers(prev => {
              const updated = prev.find(s => s._id === activeServer._id);
              if (updated) setActiveServer({ ...updated });
              return prev;
            });
          }}
          onDeleted={(id) => {
            setServers(prev => prev.filter(s => s._id !== id));
            setActiveServer(null);
            handleSwitchRoom("general");
            setShowServerSettings(false);
          }}
        />
      )}
    </div>
  );
}