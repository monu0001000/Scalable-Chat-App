const CONFIG = {
  connected:    { color: "#4ECDC4", label: "LIVE",        pulse: true  },
  demo:         { color: "#F7DC6F", label: "DEMO",        pulse: false },
  connecting:   { color: "#85C1E9", label: "CONNECTING",  pulse: true  },
  disconnected: { color: "#FF6B6B", label: "OFFLINE",     pulse: false },
  idle:         { color: "#555",    label: "IDLE",        pulse: false },
};

export default function ConnectionBadge({ status }) {
  const { color, label, pulse } = CONFIG[status] ?? CONFIG.idle;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{
        width: 7, height: 7, borderRadius: "50%", background: color,
        boxShadow: pulse ? `0 0 8px ${color}` : "none",
        animation: pulse ? "pulse 1.5s ease-in-out infinite" : "none",
      }} />
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: 2,
        color, fontFamily: "inherit",
      }}>
        {label}
      </span>
    </div>
  );
}
