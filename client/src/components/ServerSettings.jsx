import { useState, useRef } from "react";
import Avatar from "./Avatar";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function ServerSettings({ server, onClose, onUpdated, onDeleted }) {
  const [tab,         setTab]         = useState("members");
  const [inviteCode,  setInviteCode]  = useState(null);
  const [maxUses,     setMaxUses]     = useState(10);
  const [expiryHrs,   setExpiryHrs]   = useState(24);
  const [loading,     setLoading]     = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState("");
  const [newChannel,  setNewChannel]  = useState("");
  const [iconPreview, setIconPreview] = useState(server.iconUrl || null);
  const [copied,      setCopied]      = useState(false);

  const fileRef = useRef();
  const token   = localStorage.getItem("nexchat_token");

  // ── Upload server icon ────────────────────────────────────────────────────
  async function uploadIcon(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setError("");
    try {
      const form = new FormData();
      form.append("icon", file);
      const res  = await fetch(`${API}/servers/${server._id}/icon`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setIconPreview(data.iconUrl);
      onUpdated();
    } catch (e) { setError(e.message); }
    finally { setUploading(false); }
  }

  // ── Generate invite ───────────────────────────────────────────────────────
  async function generateInvite() {
    setLoading(true); setError(""); setInviteCode(null);
    try {
      const res  = await fetch(`${API}/servers/${server._id}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ maxUses, expiresInHours: expiryHrs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteCode(data.code);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  // ── Kick member ───────────────────────────────────────────────────────────
  async function kickMember(userId) {
    try {
      const res  = await fetch(`${API}/servers/${server._id}/members/${userId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdated();
    } catch (e) { setError(e.message); }
  }

  // ── Add channel ───────────────────────────────────────────────────────────
  async function addChannel() {
    if (!newChannel.trim()) return;
    try {
      const res  = await fetch(`${API}/servers/${server._id}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newChannel.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewChannel("");
      onUpdated();
    } catch (e) { setError(e.message); }
  }

  // ── Delete channel ────────────────────────────────────────────────────────
  async function deleteChannel(channelId) {
    try {
      const res  = await fetch(`${API}/servers/${server._id}/channels/${channelId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdated();
    } catch (e) { setError(e.message); }
  }

  // ── Delete server ─────────────────────────────────────────────────────────
  async function deleteServer() {
    if (!confirm(`Delete "${server.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/servers/${server._id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      onDeleted(server._id);
      onClose();
    } catch (e) { setError(e.message); }
  }

  const inviteLink = inviteCode
    ? `${window.location.origin}/invite/${inviteCode}`
    : null;

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabStyle = (t) => ({
    padding: "6px 14px", borderRadius: 6,
    cursor: "pointer", fontSize: 12, fontWeight: 600,
    border: "none", fontFamily: "inherit",
    background: tab === t ? "#1a1a2e" : "none",
    color: tab === t ? "#4ECDC4" : "#555",
  });

  const inputStyle = {
    width: "100%", padding: "9px 12px", boxSizing: "border-box",
    background: "#0a0a0f", border: "1px solid #2a2a3a",
    borderRadius: 8, color: "#fff", fontSize: 13,
    fontFamily: "inherit", outline: "none",
  };

  const myId = localStorage.getItem("nexchat_userid");

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, padding: 20,
    }}>
      <div style={{
        width: "100%", maxWidth: 480,
        background: "#111118", border: "1px solid #1e1e2e",
        borderRadius: 16, overflow: "hidden",
        maxHeight: "85vh", display: "flex", flexDirection: "column",
      }}>

        {/* Header */}
        <div style={{ padding: "20px 24px 0", borderBottom: "1px solid #1e1e2e" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>

            {/* Server icon — click to upload */}
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileRef.current.click()}>
              {iconPreview ? (
                <img src={iconPreview} alt={server.name} style={{
                  width: 36, height: 36, borderRadius: "50%",
                  objectFit: "cover", border: "2px solid #2a2a3a",
                  opacity: uploading ? 0.5 : 1,
                }} />
              ) : (
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: server.iconColor || "#4ECDC4",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "#0a0a0f",
                  border: "2px solid #2a2a3a",
                }}>
                  {server.name[0].toUpperCase()}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={uploadIcon} style={{ display: "none" }} />
            </div>

            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{server.name}</div>
              <div style={{ fontSize: 11, color: "#555" }}>{server.members?.length} members</div>
            </div>

            <button onClick={onClose} style={{
              marginLeft: "auto", background: "none", border: "none",
              color: "#555", cursor: "pointer", fontSize: 18, lineHeight: 1,
            }}>✕</button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: -1 }}>
            {["members", "channels", "invite", "danger"].map(t => (
              <button key={t} style={tabStyle(t)} onClick={() => { setTab(t); setError(""); }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {error && (
            <p style={{ color: "#FF6B6B", fontSize: 12, marginBottom: 12 }}>{error}</p>
          )}

          {/* ── MEMBERS ── */}
          {tab === "members" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {server.members?.map((m) => (
                <div key={m.userId} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", background: "#0d0d14",
                  borderRadius: 8, border: "1px solid #1e1e2e",
                }}>
                  <Avatar user={{ username: m.username, color: m.color, avatarUrl: m.avatarUrl }} size={28} />
                  <span style={{ flex: 1, fontSize: 13, color: "#ccc" }}>{m.username}</span>
                  {m.role === "owner" && (
                    <span style={{ fontSize: 9, color: "#4ECDC4", fontWeight: 700, marginRight: 6 }}>OWNER</span>
                  )}
                  {/* Only owner can kick, can't kick yourself or other owner */}
                  {server.ownerId === myId && m.userId !== myId && m.role !== "owner" && (
                    <button onClick={() => kickMember(m.userId)} style={{
                      background: "none", border: "1px solid #3a1a1a",
                      borderRadius: 5, color: "#FF6B6B", fontSize: 11,
                      cursor: "pointer", padding: "3px 8px", fontFamily: "inherit",
                    }}>
                      Kick
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── CHANNELS ── */}
          {tab === "channels" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {server.channels?.map((ch) => (
                <div key={ch._id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", background: "#0d0d14",
                  borderRadius: 8, border: "1px solid #1e1e2e",
                }}>
                  <span style={{ flex: 1, fontSize: 13, color: "#ccc" }}># {ch.name}</span>
                  {ch.name !== "general" && server.ownerId === myId && (
                    <button onClick={() => deleteChannel(ch._id)} style={{
                      background: "none", border: "1px solid #3a1a1a",
                      borderRadius: 5, color: "#FF6B6B", fontSize: 11,
                      cursor: "pointer", padding: "3px 8px", fontFamily: "inherit",
                    }}>
                      Delete
                    </button>
                  )}
                </div>
              ))}

              {/* Add new channel */}
              {server.ownerId === myId && (
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <input
                    value={newChannel}
                    onChange={e => setNewChannel(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addChannel()}
                    placeholder="new-channel-name"
                    style={inputStyle}
                  />
                  <button onClick={addChannel} style={{
                    padding: "9px 16px", background: "#4ECDC4",
                    border: "none", borderRadius: 8,
                    color: "#0a0a0f", fontWeight: 700,
                    fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                    flexShrink: 0,
                  }}>
                    Add
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── INVITE ── */}
          {tab === "invite" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
                Generate an invite link to share with friends. They can join directly via the link.
              </p>

              {/* Max uses */}
              <div>
                <label style={{ fontSize: 11, color: "#555", fontWeight: 700, letterSpacing: 1, display: "block", marginBottom: 6 }}>
                  MAX USES
                </label>
                <select value={maxUses} onChange={e => setMaxUses(Number(e.target.value))} style={{
                  ...inputStyle, cursor: "pointer",
                }}>
                  {[1, 5, 10, 25, 50, 100].map(n => (
                    <option key={n} value={n}>{n} uses</option>
                  ))}
                </select>
              </div>

              {/* Expiry */}
              <div>
                <label style={{ fontSize: 11, color: "#555", fontWeight: 700, letterSpacing: 1, display: "block", marginBottom: 6 }}>
                  EXPIRES AFTER
                </label>
                <select value={expiryHrs} onChange={e => setExpiryHrs(Number(e.target.value))} style={{
                  ...inputStyle, cursor: "pointer",
                }}>
                  <option value={1}>1 hour</option>
                  <option value={6}>6 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={72}>3 days</option>
                  <option value={168}>7 days</option>
                </select>
              </div>

              <button onClick={generateInvite} disabled={loading} style={{
                padding: "10px", background: loading ? "#2a2a3a" : "#4ECDC4",
                border: "none", borderRadius: 8,
                color: loading ? "#555" : "#0a0a0f",
                fontWeight: 700, fontSize: 12, letterSpacing: 1,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}>
                {loading ? "GENERATING..." : "GENERATE INVITE LINK"}
              </button>

              {/* Generated link */}
              {inviteLink && (
                <div style={{
                  background: "#0a0a0f", border: "1px solid #2a2a3a",
                  borderRadius: 8, padding: 12,
                }}>
                  <p style={{ fontSize: 11, color: "#555", margin: "0 0 8px", fontWeight: 700, letterSpacing: 1 }}>
                    INVITE LINK
                  </p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <code style={{
                      flex: 1, fontSize: 12, color: "#4ECDC4",
                      wordBreak: "break-all", lineHeight: 1.5,
                    }}>
                      {inviteLink}
                    </code>
                    <button onClick={copyInvite} style={{
                      background: copied ? "#4ECDC422" : "#1a1a2e",
                      border: `1px solid ${copied ? "#4ECDC4" : "#2a2a3a"}`,
                      borderRadius: 6, color: copied ? "#4ECDC4" : "#888",
                      fontSize: 11, padding: "5px 10px",
                      cursor: "pointer", fontFamily: "inherit",
                      flexShrink: 0, fontWeight: 700,
                    }}>
                      {copied ? "COPIED!" : "COPY"}
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: "#444", margin: "8px 0 0" }}>
                    Expires in {expiryHrs}h · {maxUses} max uses
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── DANGER ── */}
          {tab === "danger" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{
                padding: 16, background: "#1a0a0a",
                border: "1px solid #3a1a1a", borderRadius: 10,
              }}>
                <p style={{ fontSize: 13, color: "#FF6B6B", fontWeight: 700, margin: "0 0 6px" }}>
                  Delete Server
                </p>
                <p style={{ fontSize: 12, color: "#888", margin: "0 0 14px", lineHeight: 1.6 }}>
                  Permanently delete <strong style={{ color: "#ccc" }}>{server.name}</strong> and all its channels and messages. This cannot be undone.
                </p>
                <button onClick={deleteServer} style={{
                  padding: "9px 18px", background: "#FF6B6B",
                  border: "none", borderRadius: 8,
                  color: "#fff", fontWeight: 700,
                  fontSize: 12, cursor: "pointer",
                  fontFamily: "inherit", letterSpacing: 1,
                }}>
                  DELETE SERVER
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}