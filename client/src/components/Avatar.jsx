export default function Avatar({ user, username, color, avatarUrl, size = 32, onClick }) {
  // Accept either <Avatar user={obj} /> or <Avatar username="x" color="y" avatarUrl="z" />
  const _username  = user?.username  ?? username;
  const _color     = user?.color     ?? color;
  const _avatarUrl = user?.avatarUrl ?? avatarUrl;

  const style = {
    width: size, height: size, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: size * 0.4, color: "#0a0a0f",
    flexShrink: 0, overflow: "hidden",
    cursor: onClick ? "pointer" : "default",
    transition: "opacity 0.15s",
  };

  if (_avatarUrl) {
    return (
      <img
        src={_avatarUrl}
        alt={_username}
        onClick={onClick}
        title={_username}
        style={{ ...style, objectFit: "cover", background: _color || "#4ECDC4" }}
        onMouseEnter={e => { if (onClick) e.currentTarget.style.opacity = "0.85"; }}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      title={_username}
      style={{ ...style, background: _color || "#4ECDC4" }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      {_username?.[0]?.toUpperCase()}
    </div>
  );
}