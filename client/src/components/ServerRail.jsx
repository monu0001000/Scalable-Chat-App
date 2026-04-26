import { useState } from "react";
import CreateServer from "./CreateServer";

export default function ServerRail({ servers, activeServerId, onSelectServer, onSelectGlobal, isGlobal, onServerCreated }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div style={{
      width: 64, minWidth: 64,
      background: "#080810",
      borderRight: "1px solid #1e1e2e",
      display: "flex", flexDirection: "column",
      alignItems: "center", padding: "12px 0", gap: 8,
      height: "100%", overflowY: "auto",
    }}>
      {/* Global / Home button */}
      <RailIcon
        active={isGlobal}
        onClick={onSelectGlobal}
        title="Global channels"
        color="#4ECDC4"
      >
        🌐
      </RailIcon>

      <div style={{ width: 32, height: 1, background: "#1e1e2e", margin: "4px 0" }} />

      {/* Server icons */}
      {servers.map(s => (
        <RailIcon
          key={s._id}
          active={activeServerId === s._id}
          onClick={() => onSelectServer(s)}
          title={s.name}
          color={s.iconColor || "#4ECDC4"}
        >
          {s.iconUrl
            ? <img src={s.iconUrl} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : s.name[0].toUpperCase()
          }
        </RailIcon>
      ))}

      {/* Create server button */}
      <RailIcon
        onClick={() => setShowCreate(true)}
        title="Create a server"
        color="#2a2a3a"
        textColor="#4ECDC4"
      >
        +
      </RailIcon>

      {showCreate && (
        <CreateServer
          onClose={() => setShowCreate(false)}
          onCreated={(server) => {
            onServerCreated(server);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function RailIcon({ children, active, onClick, title, color, textColor }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 44, height: 44, borderRadius: active ? 14 : "50%",
        background: color || "#1a1a2e",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: 18, fontWeight: 700,
        color: textColor || "#0a0a0f",
        transition: "border-radius 0.2s, transform 0.15s",
        transform: hovered || active ? "scale(1.08)" : "scale(1)",
        border: active ? `2px solid #4ECDC4` : "2px solid transparent",
        flexShrink: 0, overflow: "hidden",
        position: "relative",
      }}
    >
      {children}
    </div>
  );
}