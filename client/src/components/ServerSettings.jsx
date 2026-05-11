import { useState, useRef } from "react";
import Avatar from "./Avatar";

export default function ServerSettings({ server, onClose, onUpdated, onDeleted }) {
  const [tab, setTab] = useState("members");
  const [inviteCode, setInviteCode] = useState(null);
  const [maxUses, setMaxUses] = useState(10);
  const [expiryHrs, setExpiryHrs] = useState(24);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [newChannel, setNewChannel] = useState("");
  const [iconPreview, setIconPreview] = useState(server.iconUrl || null);

  const fileRef = useRef();

  const token = localStorage.getItem("nexchat_token");
  const myId = localStorage.getItem("nexchat_userid");

  const API_URL = import.meta.env.VITE_API_URL;

  async function uploadIcon(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const form = new FormData();
      form.append("icon", file);

      const res = await fetch(
        `${API_URL}/servers/${server._id}/icon`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

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
      const res = await fetch(
        `${API_URL}/servers/${server._id}/invites`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            maxUses,
            expiresInHours: expiryHrs,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setInviteCode(data.code);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function kickMember(userId) {
    try {
      const res = await fetch(
        `${API_URL}/servers/${server._id}/members/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      onUpdated();
    } catch (e) {
      setError(e.message);
    }
  }

  async function addChannel() {
    if (!newChannel.trim()) return;

    try {
      const res = await fetch(
        `${API_URL}/servers/${server._id}/channels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newChannel.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setNewChannel("");
      onUpdated();
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteChannel(channelId) {
    try {
      const res = await fetch(
        `${API_URL}/servers/${server._id}/channels/${channelId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      onUpdated();
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteServer() {
    if (!confirm(`Delete "${server.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/servers/${server._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to delete");
      }

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
    padding: "6px 14px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    border: "none",
    background: tab === t ? "#1a1a2e" : "none",
    color: tab === t ? "#4ECDC4" : "#555",
  });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#111118",
          border: "1px solid #1e1e2e",
          borderRadius: 16,
          overflow: "hidden",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 0",
            borderBottom: "1px solid #1e1e2e",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            {/* Server icon */}
            <div
              style={{
                position: "relative",
                cursor: "pointer",
              }}
              onClick={() => fileRef.current.click()}
            >
              {iconPreview ? (
                <img
                  src={iconPreview}
                  alt={server.name}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #2a2a3a",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: server.iconColor || "#4ECDC4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#0a0a0f",
                    border: "2px solid #2a2a3a",
                  }}
                >
                  {server.name[0].toUpperCase()}
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={uploadIcon}
                style={{ display: "none" }}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {server.name}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "#555",
                }}
              >
                {server.members?.length} members
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: "#555",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: -1,
            }}
          >
            <button
              style={tabStyle("members")}
              onClick={() => setTab("members")}
            >
              Members
            </button>

            <button
              style={tabStyle("channels")}
              onClick={() => setTab("channels")}
            >
              Channels
            </button>

            <button
              style={tabStyle("invite")}
              onClick={() => setTab("invite")}
            >
              Invite
            </button>

            <button
              style={tabStyle("danger")}
              onClick={() => setTab("danger")}
            >
              Danger
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 24,
          }}
        >
          {error && (
            <p
              style={{
                color: "#FF6B6B",
                fontSize: 12,
                marginBottom: 12,
              }}
            >
              {error}
            </p>
          )}

          {/* Members */}
          {tab === "members" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {server.members?.map((m) => (
                <div key={m.userId}>
                  {/* existing member UI */}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}