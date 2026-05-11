import { useState } from "react";
import Avatar from "./Avatar.jsx";
import { formatTime } from "../utils/helpers.js";

const EMOJI_LIST = ["👍","❤️","😂","😮","😢","🔥","🎉","👀"];

export default function MessageBubble({ msg, isOwn, grouped, onOpenProfile, onReact, myId }) {
  const [isHovered, setIsHovered] = useState(false);

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
 
  const reactions = msg.reactions || {};
  const hasReactions = Object.keys(reactions).filter(e => reactions[e]?.length > 0).length > 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isOwn ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 8,
        marginTop: grouped ? 2 : 14,
        animation: "fadeSlideIn 0.2s ease forwards",
      }}
    >
      {!grouped
        ? <Avatar
            username={msg.username}
            color={msg.color}
            avatarUrl={msg.avatarUrl}
            size={30}
            onClick={() => onOpenProfile?.(msg.username)}
          />
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
            <span
              onClick={() => onOpenProfile?.(msg.username)}
              style={{ fontSize: 12, fontWeight: 700, color: msg.color, cursor: "pointer" }}
            >
              {msg.username}
            </span>
            <span style={{ fontSize: 10, color: "#333" }}>
              {formatTime(msg.timestamp)}
            </span>
          </div>
        )}

        {/*
          paddingTop: 40 extends the container upward so the absolutely-positioned
          picker lives INSIDE the div's hit area. Without this, the picker floats
          above the container boundary and the mouse exits the div on the way up,
          firing onMouseLeave before the cursor reaches the picker.
        */}
        <div
          style={{ position: "relative", paddingTop: 40 }}
          
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Emoji picker — top:2 places it inside the paddingTop band */}
          {isHovered && (
            <div
              style={{
                position: "absolute",
                [isOwn ? "left" : "right"]: 0,
                top: 2,
                display: "flex", gap: 2,
                padding: "4px 8px",
                background: "#0d0d14",
                border: "1px solid #2a2a3a",
                borderRadius: 20,
                zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              {EMOJI_LIST.map(e => (
                <button
                  key={e}
                  onClick={() => { onReact?.(msg.msgId || msg.id, e); setIsHovered(false); }}
                  style={{
                    background: "none", border: "none",
                    cursor: "pointer", fontSize: 16, padding: "2px 3px",
                    borderRadius: 6, lineHeight: 1,
                    transition: "transform 0.1s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.3)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          {/* Message bubble */}
          <div
            style={{
              padding: "9px 13px",
              background: isOwn ? "#1a2a2a" : "#16161e",
              borderRadius: isOwn ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
              border: `1px solid ${isOwn ? "#4ECDC422" : "#1e1e2e"}`,
              fontSize: 14, color: "#ddd", lineHeight: 1.55,
              wordBreak: "break-word",
            }}
          >
            {msg.text}

            {msg.imageUrl && (
              <img
                src={msg.imageUrl}
                alt="attachment"
                onClick={() => window.open(msg.imageUrl, "_blank")}
                style={{
                  maxWidth: 260, maxHeight: 180, borderRadius: 8,
                  objectFit: "cover", cursor: "pointer",
                  marginTop: msg.text ? 8 : 0,
                  display: "block",
                }}
              />
            )}
          </div>

          {/* Reaction pills */}
          {hasReactions && (
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4,
              justifyContent: isOwn ? "flex-end" : "flex-start",
            }}>
              {Object.entries(reactions).map(([emoji, userIds]) =>
                userIds?.length > 0 ? (
                  <button
                    key={emoji}
                    onClick={() => onReact?.(msg.msgId || msg.id, emoji)}
                    style={{
                      padding: "2px 8px", borderRadius: 12,
                      border: `1px solid ${userIds.includes(myId) ? "#4ECDC4" : "#2a2a3a"}`,
                      background: userIds.includes(myId) ? "#0d2020" : "#13131f",
                      color: userIds.includes(myId) ? "#4ECDC4" : "#888",
                      fontSize: 12, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4,
                    }}
                  >
                    {emoji} <span style={{ fontSize: 11 }}>{userIds.length}</span>
                  </button>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}