import { useState } from "react";
import { sanitize, slugify } from "../utils/helpers.js";

export default function JoinScreen({ onJoin }) {
  const [username, setUsername]   = useState("");
  const [room, setRoom]           = useState("");
  const [wsUrl, setWsUrl]         = useState("ws://localhost:8080");

  const handleSubmit = (e) => {
    e.preventDefault();
    onJoin({
      username: sanitize(username) || "Anonymous",
      room:     slugify(room),
      wsUrl:    wsUrl.trim() || "ws://localhost:8080",
    });
  };

  const field = {
    width: "100%", padding: "10px 14px",
    background: "#0a0a0f", border: "1px solid #2a2a3a",
    borderRadius: 8, color: "#fff", fontSize: 14,
    fontFamily: "inherit",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
  };

  return (
    <div style={{
      width: "100%", maxWidth: 420,
      background: "#111118", border: "1px solid #1e1e2e",
      borderRadius: 16, padding: "40px 40px 36px",
      boxShadow: "0 0 80px #4ECDC40a",
    }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 10, letterSpacing: 4,
          color: "#4ECDC4", fontWeight: 700, marginBottom: 10,
        }}>
          ◈ WEBSOCKET CHAT
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", lineHeight: 1.25 }}>
          Enter the<br />
          <span style={{ color: "#4ECDC4" }}>conversation.</span>
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {[
          { label: "YOUR NAME",   value: username, set: setUsername, placeholder: "anonymous",          type: "text" },
          { label: "ROOM",        value: room,     set: setRoom,     placeholder: "general",            type: "text" },
          { label: "SERVER URL",  value: wsUrl,    set: setWsUrl,    placeholder: "ws://localhost:8080",type: "text" },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label}>
            <label style={{
              fontSize: 9, letterSpacing: 2, color: "#555",
              fontWeight: 700, display: "block", marginBottom: 6,
            }}>
              {label}
            </label>
            <input
              value={value}
              onChange={e => set(e.target.value)}
              placeholder={placeholder}
              style={field}
              onFocus={e => {
                e.target.style.borderColor = "#4ECDC4";
                e.target.style.boxShadow   = "0 0 0 2px #4ECDC422";
              }}
              onBlur={e => {
                e.target.style.borderColor = "#2a2a3a";
                e.target.style.boxShadow   = "none";
              }}
            />
          </div>
        ))}

        <button
          type="submit"
          style={{
            marginTop: 8, padding: "12px",
            background: "#4ECDC4", border: "none", borderRadius: 8,
            color: "#0a0a0f", fontWeight: 700, fontSize: 12,
            letterSpacing: 2, cursor: "pointer",
            fontFamily: "inherit",
            transition: "opacity 0.15s, transform 0.1s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          JOIN CHAT →
        </button>

        <p style={{ fontSize: 11, color: "#333", textAlign: "center", lineHeight: 1.6 }}>
          No server running? Click join to browse in demo mode.
        </p>
      </form>
    </div>
  );
}
