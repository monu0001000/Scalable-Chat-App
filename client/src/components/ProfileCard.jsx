import { useState, useEffect, useRef } from "react";

const API = "http://localhost:8080";

export default function ProfileCard({username, myUsername, onClose, onAvatarUpdate, onOpenDM}) {
  const [profile,   setProfile]   = useState(null);
  const [editing,   setEditing]   = useState(false);
  const [bio,       setBio]       = useState("");
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const fileRef = useRef();

  const isOwnProfile = username === myUsername;

  useEffect(() => {
    fetch(`${API}/users/${username}`)
      .then(r => r.json())
      .then(data => { setProfile(data); setBio(data.bio || ""); })
      .catch(() => setError("Could not load profile"));
  }, [username]);

  const saveBio = async () => {
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("nexchat_token");
      const res = await fetch(`${API}/users/profile`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ bio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(p => ({ ...p, bio: data.bio }));
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const token = localStorage.getItem("nexchat_token");
      const form = new FormData();
      form.append("avatar", file);
      const res = await fetch(`${API}/users/avatar`, {
        method:  "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body:    form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setProfile(p => ({ ...p, avatarUrl: data.avatarUrl }));
      onAvatarUpdate?.(data.avatarUrl);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDM = () => {
    if (!profile) return;
    // Use toString() to ensure ObjectId is converted to plain string
    onOpenDM?.({ userId: profile._id?.toString?.() || String(profile._id), username: profile.username });
    onClose();
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 20,
      }}
    >
      <div style={{
        width: "100%", maxWidth: 380,
        background: "#111118", border: "1px solid #1e1e2e",
        borderRadius: 16, overflow: "hidden",
        boxShadow: "0 0 60px #4ECDC410",
      }}>
        {/* Top banner */}
        <div style={{ height: 80, background: "linear-gradient(135deg, #4ECDC422, #45B7D122)" }} />

        <div style={{ padding: "0 24px 24px" }}>
          {/* Avatar */}
          <div style={{ marginTop: -44, marginBottom: 16, position: "relative", display: "inline-block" }}>
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={username}
                style={{ width: 80, height: 80, borderRadius: "50%", border: "3px solid #111118", objectFit: "cover" }}
              />
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: profile?.color || "#4ECDC4",
                border: "3px solid #111118",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 700, color: "#0a0a0f",
              }}>
                {username?.[0]?.toUpperCase()}
              </div>
            )}

            {isOwnProfile && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); fileRef.current.click(); }}
                  disabled={uploading}
                  style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 26, height: 26, borderRadius: "50%",
                    background: "#4ECDC4", border: "2px solid #111118",
                    cursor: uploading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12,
                  }}
                  title="Change avatar"
                >
                  {uploading ? "⏳" : "📷"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={uploadAvatar} style={{ display: "none" }} />
              </>
            )}
          </div>

          {/* Username + color dot */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{username}</span>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: profile?.color || "#4ECDC4", display: "inline-block" }} />
          </div>

          {profile?.createdAt && (
            <p style={{ fontSize: 11, color: "#444", marginBottom: 16 }}>
              Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          )}

          {editing ? (
            <div style={{ marginBottom: 16 }}>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={150}
                rows={3}
                placeholder="Write something about yourself..."
                style={{
                  width: "100%", padding: "10px 12px",
                  background: "#0a0a0f", border: "1px solid #4ECDC4",
                  borderRadius: 8, color: "#fff", fontSize: 13,
                  fontFamily: "inherit", resize: "none", outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ fontSize: 11, color: "#444", textAlign: "right" }}>{bio.length}/150</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={saveBio} disabled={saving} style={{
                  flex: 1, padding: "8px", background: "#4ECDC4",
                  border: "none", borderRadius: 8, color: "#0a0a0f",
                  fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                }}>
                  {saving ? "SAVING..." : "SAVE"}
                </button>
                <button onClick={() => { setEditing(false); setBio(profile?.bio || ""); }} style={{
                  flex: 1, padding: "8px", background: "transparent",
                  border: "1px solid #2a2a3a", borderRadius: 8, color: "#555",
                  fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                }}>
                  CANCEL
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: profile?.bio ? "#aaa" : "#444", lineHeight: 1.6, minHeight: 20 }}>
                {profile?.bio || (isOwnProfile ? "No bio yet — click Edit to add one." : "No bio.")}
              </p>
              {isOwnProfile && (
                <button onClick={() => setEditing(true)} style={{
                  marginTop: 8, padding: "6px 14px",
                  background: "transparent", border: "1px solid #2a2a3a",
                  borderRadius: 6, color: "#4ECDC4", fontSize: 11,
                  letterSpacing: 1, cursor: "pointer", fontFamily: "inherit",
                  fontWeight: 700,
                }}>
                  EDIT BIO
                </button>
              )}
            </div>
          )}

          {error && (
            <p style={{ fontSize: 12, color: "#FF6B6B", marginBottom: 12 }}>{error}</p>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            {!isOwnProfile && (
              <button onClick={handleDM} style={{
                flex: 1, padding: "10px",
                background: "#4ECDC4", border: "none",
                borderRadius: 8, color: "#0a0a0f", fontSize: 12,
                letterSpacing: 1, cursor: "pointer", fontFamily: "inherit",
                fontWeight: 700,
              }}>
                💬 MESSAGE
              </button>
            )}
            <button onClick={onClose} style={{
              flex: 1, padding: "10px",
              background: "transparent", border: "1px solid #1e1e2e",
              borderRadius: 8, color: "#555", fontSize: 12,
              letterSpacing: 1, cursor: "pointer", fontFamily: "inherit",
              fontWeight: 700,
            }}>
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}