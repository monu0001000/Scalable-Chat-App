import Avatar from "./Avatar.jsx";
import ConnectionBadge from "./ConnectionBadge.jsx";

const DEFAULT_ROOMS = ["general", "tech", "design", "random"];

export default function Sidebar({
  currentRoom, onSwitchRoom,
  username, myColor, status,
  onlineUsers,
}) {
  return (
    <div style={{
      width: 200, background: "#0d0d14",
      borderRight: "1px solid #1e1e2e",
      display: "flex", flexDirection: "column",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: "18px 16px 14px",
        borderBottom: "1px solid #1e1e2e",
      }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: "#4ECDC4", fontWeight: 700 }}>
          ◈ NEXCHAT
        </div>
      </div>

      {/* Channels */}
      <div style={{ padding: "14px 0", flex: 1, overflowY: "auto" }}>
        <div style={{
          fontSize: 9, letterSpacing: 2, color: "#444",
          fontWeight: 700, padding: "0 16px 8px",
        }}>
          CHANNELS
        </div>

        {DEFAULT_ROOMS.map((room) => {
          const active = room === currentRoom;
          return (
            <button
              key={room}
              onClick={() => onSwitchRoom(room)}
              style={{
                width: "100%", padding: "8px 16px",
                background: active ? "#1a1a2e" : "transparent",
                border: "none",
                borderLeft: `2px solid ${active ? "#4ECDC4" : "transparent"}`,
                color: active ? "#4ECDC4" : "#555",
                fontSize: 13, textAlign: "left",
                cursor: "pointer", fontFamily: "inherit",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#1a1a2e44"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              # {room}
            </button>
          );
        })}

        {/* Online users */}
        {onlineUsers.length > 0 && (
          <>
            <div style={{
              fontSize: 9, letterSpacing: 2, color: "#444",
              fontWeight: 700, padding: "14px 16px 8px",
            }}>
              ONLINE — {onlineUsers.length}
            </div>
            {onlineUsers.map((u) => (
              <div key={u.id} style={{
                display: "flex", alignItems: "center",
                gap: 8, padding: "5px 16px",
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: u.color,
                  boxShadow: `0 0 5px ${u.color}`,
                }} />
                <span style={{
                  fontSize: 12, color: "#555",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {u.username}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Current user footer */}
      <div style={{
        padding: "10px 12px",
        borderTop: "1px solid #1e1e2e",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <Avatar username={username || "?"} color={myColor} size={26} />
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div style={{
            fontSize: 11, color: "#ccc", fontWeight: 600,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {username}
          </div>
          <ConnectionBadge status={status} />
        </div>
      </div>
    </div>
  );
}
