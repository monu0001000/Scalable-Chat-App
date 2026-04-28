import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";
const WS  = import.meta.env.VITE_WS_URL  || "ws://localhost:8080";

export default function JoinScreen({ onJoin }) {
  const [mode,     setMode]     = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [room,     setRoom]     = useState("general");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";

    try {
      const res  = await fetch(`${API}${endpoint}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      localStorage.setItem("nexchat_token",    data.token);
      localStorage.setItem("nexchat_username", data.username);
      localStorage.setItem("nexchat_color",    data.color);

      const roomSlug = room.trim().toLowerCase().replace(/\s+/g, "-") || "general";

      onJoin({
        username: data.username,
        color:    data.color,
        token:    data.token,
        room:     roomSlug,
        wsUrl:    WS,
      });

    } catch (err) {
      setError("Could not reach the server. Is it running?");
      setLoading(false);
    }
  };

  const field = {
    width: "100%", padding: "10px 14px",
    background: "#0a0a0f", border: "1px solid #2a2a3a",
    borderRadius: 8, color: "#fff", fontSize: 14,
    fontFamily: "inherit", outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  };

  const focusField = (e) => { e.target.style.borderColor = "#4ECDC4"; e.target.style.boxShadow = "0 0 0 2px #4ECDC422"; };
  const blurField  = (e) => { e.target.style.borderColor = "#2a2a3a"; e.target.style.boxShadow = "none"; };

  return (
    <div style={{
      width: "100%", maxWidth: 420,
      background: "#111118", border: "1px solid #1e1e2e",
      borderRadius: 16, padding: "40px 40px 36px",
      boxShadow: "0 0 80px #4ECDC40a",
    }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: "#4ECDC4", fontWeight: 700, marginBottom: 10 }}>
          ◈ NEXCHAT
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: 1.25, margin: 0 }}>
          {mode === "login"
            ? <>Welcome<br /><span style={{ color: "#4ECDC4" }}>back.</span></>
            : <>Create your<br /><span style={{ color: "#4ECDC4" }}>account.</span></>}
        </h1>
      </div>

      {/* Mode toggle */}
      <div style={{
        display: "flex", background: "#0a0a0f",
        borderRadius: 8, padding: 4, marginBottom: 24,
        border: "1px solid #1e1e2e",
      }}>
        {["login", "register"].map((m) => (
          <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
            flex: 1, padding: "8px 0", border: "none", borderRadius: 6,
            background: mode === m ? "#4ECDC4" : "transparent",
            color: mode === m ? "#0a0a0f" : "#555",
            fontWeight: 700, fontSize: 11, letterSpacing: 1.5,
            cursor: "pointer", fontFamily: "inherit",
            transition: "all 0.15s", textTransform: "uppercase",
          }}>
            {m}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        <div>
          <label style={{ fontSize: 9, letterSpacing: 2, color: "#555", fontWeight: 700, display: "block", marginBottom: 6 }}>
            USERNAME
          </label>
          <input value={username} onChange={e => setUsername(e.target.value)}
            placeholder="your name" required
            style={field} onFocus={focusField} onBlur={blurField} />
        </div>

        <div>
          <label style={{ fontSize: 9, letterSpacing: 2, color: "#555", fontWeight: 700, display: "block", marginBottom: 6 }}>
            PASSWORD {mode === "register" && <span style={{ color: "#333" }}>(min 6 chars)</span>}
          </label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required
            style={field} onFocus={focusField} onBlur={blurField} />
        </div>

        <div>
          <label style={{ fontSize: 9, letterSpacing: 2, color: "#555", fontWeight: 700, display: "block", marginBottom: 6 }}>
            ROOM
          </label>
          <input value={room} onChange={e => setRoom(e.target.value)}
            placeholder="general"
            style={field} onFocus={focusField} onBlur={blurField} />
        </div>

        {error && (
          <div style={{
            padding: "10px 14px", background: "#FF6B6B18",
            border: "1px solid #FF6B6B44", borderRadius: 8,
            color: "#FF6B6B", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          marginTop: 4, padding: "12px",
          background: loading ? "#2a2a3a" : "#4ECDC4",
          border: "none", borderRadius: 8,
          color: loading ? "#555" : "#0a0a0f",
          fontWeight: 700, fontSize: 12, letterSpacing: 2,
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "inherit", transition: "opacity 0.15s",
        }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          {loading ? "PLEASE WAIT..." : mode === "login" ? "LOGIN →" : "CREATE ACCOUNT →"}
        </button>

      </form>
    </div>
  );
}