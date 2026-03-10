import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";

export default function MessageList({ messages, myId, typingUsers }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  return (
    <div style={{
      flex: 1, overflowY: "auto", padding: "20px 20px 12px",
      display: "flex", flexDirection: "column", gap: 0,
    }}>
      {messages.map((msg, i) => {
        const isOwn = msg.userId === myId || msg.isOwn;
        const prev  = messages[i - 1];
        const grouped =
          prev &&
          prev.userId === msg.userId &&
          (msg.timestamp - prev.timestamp) < 60_000 &&
          prev.type !== "system" &&
          msg.type   !== "system";

        return (
          <MessageBubble
            key={msg.id ?? i}
            msg={msg}
            isOwn={isOwn}
            grouped={grouped}
          />
        );
      })}

      {typingUsers.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center",
          gap: 8, marginTop: 10, paddingLeft: 38,
        }}>
          <div style={{ display: "flex", gap: 3 }}>
            {[0, 0.2, 0.4].map((delay, i) => (
              <div key={i} style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "#4ECDC4", opacity: 0.7,
                animation: `blink 1.2s ease-in-out ${delay}s infinite`,
              }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: "#4ECDC4" }}>
            {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
