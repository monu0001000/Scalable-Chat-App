import { useState, useRef } from "react";
import Avatar from "./Avatar";

export default function ServerSettings({ server, onClose, onUpdated, onDeleted }) {
  const [tab,        setTab]       = useState("members");
  const [inviteCode, setInviteCode] = useState(null);
  const [maxUses,    setMaxUses]   = useState(10);
  const [expiryHrs,  setExpiryHrs] = useState(24);
  const [loading,    setLoading]   = useState(false);
  const [uploading,  setUploading] = useState(false);
  const [error,      setError]     = useState("");
  const [newChannel, setNewChannel] = useState("");
  const [iconPreview, setIconPreview] = useState(server.iconUrl || null);
  const fileRef = useRef();

  const token = localStorage.getItem("nexchat_token");
  const myId  = localStorage.getItem("nexchat_userid");

  async function uploadIcon(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("icon", file);
      const res  = await fetch(`http://localhost:8080/servers/${server._id}/icon`, {
        method:  "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body:    form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setIconPreview(data.iconUrl);
      onUpdated();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function generateInvite() {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`http://localhost:8080/servers/${server._id}/invites`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ maxUses, expiresInHours: expiryHrs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteCode(data.code);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function kickMember(userId) {
    try {
      const res = await fetch(`http://localhost:8080/servers/${server._id}/members/${userId}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdated();
    } catch (e) {
      setError(e.message);
    }
  }

  async function addChannel() {
    if (!newChannel.trim()) return;
    try {
      const res  = await fetch(`http://localhost:8080/servers/${server._id}/channels`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ name: newChannel.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewChannel("");
      onUpdated();
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteChannel(channelId) {
    try {
      const res = await fetch(
        `http://localhost:8080/servers/${server._id}/channels/${channelId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdated();
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteServer() {
    if (!confirm(`Delete "${server.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`http://localhost:8080/servers/${server._id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      onDeleted(server._id);
      onClose();
    } catch (e) {
      setError(e.message);
    }
  }

  const inviteLink = inviteCode
    ? `${window.location.origin}/invite/${inviteCode}`
    : null;

  const tabStyle = (t) => ({
    padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12,
    fontWeight: 600, border: "none",
    background: tab === t ? "#1a1a2e" : "none",
    color: tab === t ? "#4ECDC4" : "#555",
  });

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200, padding: 20,
      }}
    >
      <div style={{
        width: "100%", maxWidth: 480,
        background: "#111118", border: "1px solid #1e1e2e",
        borderRadius: 16, overflow: "hidden",
        maxHeight: "85vh", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 0", borderBottom: "1px solid #1e1e2e" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            {/* Server icon — clickable to upload */}
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileRef.current.click()}>
              {iconPreview ? (
                <img src={iconPreview} alt={server.name}
                  style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover",
                    border: "2px solid #2a2a3a" }} />
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
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: uploading ? 1 : 0, transition: "opacity 0.15s",
                fontSize: 12,
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = uploading ? 1 : 0}
              >
                {uploading ? "⏳" : "📷"}
              </div>
              <input ref={fileRef} type="file" accept="image/*"
                onChange={uploadIcon} style={{ display: "none" }} />
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
            <button style={tabStyle("members")}  onClick={() => setTab("members")}>Members</button>
            <button style={tabStyle("channels")} onClick={() => setTab("channels")}>Channels</button>
            <button style={tabStyle("invite")}   onClick={() => setTab("invite")}>Invite</button>
            <button style={tabStyle("danger")}   onClick={() => setTab("danger")}>Danger</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {error && <p style={{ color: "#FF6B6B", fontSize: 12, marginBottom: 12 }}>{error}</p>}

          {/* Members tab */}
          {tab === "members" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {server.members?.map(m => (
                <div key={m.userId} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", background: "#0a0a0f",
                  borderRadius: 8, border: "1px solid #1e1e2e",
                }}>
                  <Avatar user={{ username: m.username, color: m.color }} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#e0e0e0", fontWeight: 500 }}>{m.username}</div>
                    <div style={{ fontSize: 11, color: m.role === "owner" ? "#4ECDC4" : "#555" }}>
                      {m.role}
                    </div>
                  </div>
                  {m.role !== "owner" && String(m.userId) !== myId && (
                    <button onClick={() => kickMember(m.userId)} style={{
                      padding: "4px 10px", borderRadius: 6, border: "none",
                      background: "#2a0a0a", color: "#FF6B6B",
                      fontSize: 11, fontWeight: 600, cursor: "pointer",
                    }}>
                      Kick
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Channels tab */}
          {tab === "channels" && (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                {server.channels?.map(ch => (
                  <div key={ch._id} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px", background: "#0a0a0f",
                    borderRadius: 8, border: "1px solid #1e1e2e",
                  }}>
                    <span style={{ color: "#555", fontSize: 14 }}>#</span>
                    <span style={{ flex: 1, fontSize: 13, color: "#e0e0e0" }}>{ch.name}</span>
                    {server.channels.length > 1 && (
                      <button onClick={() => deleteChannel(ch._id)} style={{
                        background: "none", border: "none", color: "#555",
                        cursor: "pointer", fontSize: 14, lineHeight: 1,
                      }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={newChannel}
                  onChange={e => setNewChannel(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addChannel()}
                  placeholder="new-channel"
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: 8,
                    background: "#0a0a0f", border: "1px solid #2a2a3a",
                    color: "#fff", fontSize: 13, outline: "none",
                  }}
                />
                <button onClick={addChannel} style={{
                  padding: "8px 14px", borderRadius: 8, border: "none",
                  background: "#4ECDC4", color: "#0a0a0f",
                  fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}>Add</button>
              </div>
            </div>
          )}

          {/* Invite tab */}
          {tab === "invite" && (
            <div>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
                Generate a link that lets others join this server.
              </p>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 4 }}>MAX USES</label>
                  <select value={maxUses} onChange={e => setMaxUses(Number(e.target.value))} style={{
                    width: "100%", padding: "8px", borderRadius: 8,
                    background: "#0a0a0f", border: "1px solid #2a2a3a",
                    color: "#fff", fontSize: 13,
                  }}>
                    {[1, 5, 10, 25, 50, 100].map(n => (
                      <option key={n} value={n}>{n} uses</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 4 }}>EXPIRES IN</label>
                  <select value={expiryHrs} onChange={e => setExpiryHrs(Number(e.target.value))} style={{
                    width: "100%", padding: "8px", borderRadius: 8,
                    background: "#0a0a0f", border: "1px solid #2a2a3a",
                    color: "#fff", fontSize: 13,
                  }}>
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={72}>3 days</option>
                    <option value={168}>7 days</option>
                  </select>
                </div>
              </div>
              <button onClick={generateInvite} disabled={loading} style={{
                width: "100%", padding: "10px", borderRadius: 8, border: "none",
                background: "#4ECDC4", color: "#0a0a0f",
                fontWeight: 700, fontSize: 14, cursor: "pointer",
                marginBottom: 16, opacity: loading ? 0.6 : 1,
              }}>
                {loading ? "Generating…" : "Generate invite link"}
              </button>
              {inviteLink && (
                <div style={{
                  padding: "10px 14px", background: "#0a0a0f",
                  border: "1px solid #2a2a3a", borderRadius: 8,
                }}>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>INVITE LINK</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <code style={{ flex: 1, fontSize: 12, color: "#4ECDC4", wordBreak: "break-all" }}>
                      {inviteLink}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(inviteLink)}
                      style={{
                        padding: "4px 10px", borderRadius: 6, border: "1px solid #2a2a3a",
                        background: "none", color: "#888", fontSize: 11, cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >Copy</button>
                  </div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 6 }}>
                    Expires in {expiryHrs}h · max {maxUses} uses
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Danger tab */}
          {tab === "danger" && (
            <div>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
                Deleting a server is permanent and cannot be undone. All channels and messages will be lost.
              </p>
              <button onClick={deleteServer} style={{
                width: "100%", padding: "10px", borderRadius: 8,
                border: "1px solid #FF6B6B", background: "none",
                color: "#FF6B6B", fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}>
                Delete server
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}