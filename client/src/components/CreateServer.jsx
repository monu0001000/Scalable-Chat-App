import { useState } from "react";

const COLORS = [
  "#4ECDC4",
  "#FF6B6B",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#F1948A",
];

export default function CreateServer({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#4ECDC4");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  async function handleCreate() {
    if (!name.trim()) {
      return setError("Server name is required");
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("nexchat_token");

      const res = await fetch(`${API_URL}/servers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          iconColor: color,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      onCreated(data.server);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

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
          maxWidth: 400,
          background: "#111118",
          border: "1px solid #1e1e2e",
          borderRadius: 16,
          padding: 28,
        }}
      >
        <h2
          style={{
            margin: "0 0 4px",
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          Create a server
        </h2>

        <p
          style={{
            margin: "0 0 24px",
            fontSize: 13,
            color: "#555",
          }}
        >
          Give your server a name and pick an icon color.
        </p>

        {/* Icon preview */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "#0a0a0f",
            }}
          >
            {name.trim()?.[0]?.toUpperCase() || "S"}
          </div>
        </div>

        {/* Color picker */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          {COLORS.map((c) => (
            <div
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: c,
                cursor: "pointer",
                border:
                  color === c
                    ? "3px solid #fff"
                    : "3px solid transparent",
                transition: "border 0.15s",
              }}
            />
          ))}
        </div>

        {/* Name input */}
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="My Awesome Server"
          maxLength={50}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 12px",
            borderRadius: 8,
            fontSize: 14,
            background: "#0a0a0f",
            border: "1px solid #2a2a3a",
            color: "#fff",
            marginBottom: 8,
            outline: "none",
          }}
        />

        <div
          style={{
            fontSize: 11,
            color: "#444",
            textAlign: "right",
            marginBottom: 16,
          }}
        >
          {name.length}/50
        </div>

        {error && (
          <p
            style={{
              fontSize: 12,
              color: "#FF6B6B",
              marginBottom: 12,
            }}
          >
            {error}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >
          <button
            onClick={handleCreate}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 8,
              border: "none",
              background: "#4ECDC4",
              color: "#0a0a0f",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Creating…" : "Create server"}
          </button>

          <button
            onClick={onClose}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #2a2a3a",
              background: "none",
              color: "#555",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}