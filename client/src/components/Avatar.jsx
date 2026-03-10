export default function Avatar({ username = "?", color = "#4ECDC4", size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.4, fontWeight: 700,
      color: "#0a0a0f", flexShrink: 0,
      boxShadow: `0 0 0 2px #0a0a0f, 0 0 10px ${color}44`,
      userSelect: "none",
    }}>
      {username[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
