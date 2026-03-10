import Avatar from "./Avatar.jsx";
import { formatTime } from "../utils/helpers.js";

export default function MessageBubble({ msg, isOwn, grouped }) {
  if (msg.type === "system") {
    return (
      <div style={{
        textAlign: "center", fontSize: 11, color: "#444",
        padding: "6px 0", letterSpacing: 0.5,
      }}>
        {msg.text}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: isOwn ? "row-reverse" : "row",
      alignItems: "flex-end",
      gap: 8,
      marginTop: grouped ? 2 : 14,
      animation: "fadeSlideIn 0.2s ease forwards",
    }}>
      {!grouped
        ? <Avatar username={msg.username} color={msg.color} size={30} />
        : <div style={{ width: 30, flexShrink: 0 }} />
      }

      <div style={{
        maxWidth: "68%", display: "flex",
        flexDirection: "column",
        alignItems: isOwn ? "flex-end" : "flex-start",
      }}>
        {!grouped && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            marginBottom: 4,
            flexDirection: isOwn ? "row-reverse" : "row",
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: msg.color }}>
              {msg.username}
            </span>
            <span style={{ fontSize: 10, color: "#333" }}>
              {formatTime(msg.timestamp)}
            </span>
          </div>
        )}

        <div style={{
          padding: "9px 13px",
          background: isOwn ? "#1a2a2a" : "#16161e",
          borderRadius: isOwn
            ? "12px 12px 4px 12px"
            : "12px 12px 12px 4px",
          border: `1px solid ${isOwn ? "#4ECDC422" : "#1e1e2e"}`,
          fontSize: 14, color: "#ddd", lineHeight: 1.55,
          wordBreak: "break-word",
        }}>
          {msg.text}
        </div>
      </div>
    </div>
  );
}
