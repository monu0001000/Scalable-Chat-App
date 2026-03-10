import { useState, useRef } from "react";

export default function MessageInput({ onSend, onTyping, disabled }) {
  const [text, setText] = useState("");
  const typingTimeout = useRef(null);
  const isTyping = useRef(false);

  const handleChange = (val) => {
    setText(val);
    if (!isTyping.current) { isTyping.current = true; onTyping(true); }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTyping.current = false;
      onTyping(false);
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    clearTimeout(typingTimeout.current);
    isTyping.current = false;
    onTyping(false);
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: "10px 20px 16px",
        borderTop: "1px solid #1e1e2e",
        display: "flex", gap: 10,
      }}
    >
      <input
        value={text}
        onChange={e => handleChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSubmit(e)}
        placeholder={disabled ? "Connecting…" : "Type a message…"}
        disabled={disabled}
        style={{
          flex: 1, padding: "10px 14px",
          background: "#0d0d14",
          border: "1px solid #1e1e2e",
          borderRadius: 8, color: "#fff", fontSize: 14,
          fontFamily: "inherit",
          outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          opacity: disabled ? 0.5 : 1,
        }}
        onFocus={e => {
          e.target.style.borderColor = "#4ECDC4";
          e.target.style.boxShadow   = "0 0 0 2px #4ECDC418";
        }}
        onBlur={e => {
          e.target.style.borderColor = "#1e1e2e";
          e.target.style.boxShadow   = "none";
        }}
      />
      <button
        type="submit"
        disabled={!canSend}
        style={{
          padding: "10px 18px",
          background: canSend ? "#4ECDC4" : "#16161e",
          border: `1px solid ${canSend ? "#4ECDC4" : "#2a2a3a"}`,
          borderRadius: 8,
          color: canSend ? "#0a0a0f" : "#333",
          fontWeight: 700, fontSize: 11, letterSpacing: 2,
          cursor: canSend ? "pointer" : "default",
          fontFamily: "inherit",
          transition: "all 0.2s",
          flexShrink: 0,
        }}
      >
        SEND
      </button>
    </form>
  );
}
