import { useState } from "react";

export default function FriendRequest({ onClose, onSent }) {
  const [username, setUsername] = useState("");
  const [status, setStatus]     = useState(null); // null | "success" | "error"
  const [message, setMessage]   = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSend() {
    if (!username.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const token = localStorage.getItem("nexchat_token");
      const res = await fetch(
        `http://localhost:8080/friends/request/${username.trim()}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(`Request sent to ${username.trim()}!`);
        onSent?.();
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setMessage("Could not reach server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--color-background-primary)",
        border: "1px solid var(--color-border-tertiary)",
        borderRadius: 12, padding: 24, width: 300,
        fontFamily: "var(--font-sans)",
      }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 500,
          color: "var(--color-text-primary)" }}>
          Add a friend
        </h2>

        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 12px" }}>
          Enter their exact username to send a request.
        </p>

        <input
          autoFocus
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="username"
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "8px 10px", borderRadius: 8, fontSize: 14,
            border: "1px solid var(--color-border-secondary)",
            background: "var(--color-background-secondary)",
            color: "var(--color-text-primary)", marginBottom: 12,
          }}
        />

        {status && (
          <p style={{
            fontSize: 13, margin: "0 0 12px", borderRadius: 6, padding: "6px 10px",
            background: status === "success"
              ? "var(--color-background-success)"
              : "var(--color-background-danger)",
            color: status === "success"
              ? "var(--color-text-success)"
              : "var(--color-text-danger)",
          }}>
            {message}
          </p>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSend} disabled={loading} style={{
            flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
            background: "var(--color-text-primary)", color: "var(--color-background-primary)",
            fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}>
            {loading ? "Sending…" : "Send request"}
          </button>
          <button onClick={onClose} style={{
            padding: "8px 14px", borderRadius: 8,
            border: "1px solid var(--color-border-tertiary)",
            background: "none", color: "var(--color-text-secondary)",
            fontSize: 14, cursor: "pointer",
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}