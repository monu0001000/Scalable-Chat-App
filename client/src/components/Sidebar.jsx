import { useState } from "react";
import Avatar from "./Avatar";
import FriendRequest from "./FriendRequest";

export default function Sidebar({
  currentRoom,
  onSwitchRoom,
  username,
  myColor,
  myAvatarUrl,
  status,
  onlineUsers = [],
  onLogout,
  onOpenProfile,
  friends = [],
  friendRequests = [],
  onOpenDM,
  onFriendsUpdate,
  activeServer,
  onServerSettings,
}) {
  const [showAddFriend, setShowAddFriend] = useState(false);
  const channels = ["general", "tech", "design", "random"];
  const me = { username, color: myColor, avatarUrl: myAvatarUrl };
  const myId = localStorage.getItem("nexchat_userid");

  return (
    <aside style={{
      width: 220, minWidth: 220,
      background: "#0d0d14",
      borderRight: "1px solid #1e1e2e",
      display: "flex", flexDirection: "column",
      height: "100%", overflow: "hidden",
      fontFamily: "inherit",
    }}>

      {/* Header */}
      <div style={{
        padding: "16px 16px 12px",
        borderBottom: "1px solid #1e1e2e",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "#4ECDC4", flexShrink: 0,
        }} />
        <span style={{
          fontSize: 13, fontWeight: 700, letterSpacing: "0.08em",
          color: "#4ECDC4", textTransform: "uppercase",
        }}>
          {activeServer ? activeServer.name : "NexChat"}
        </span>
        {activeServer && activeServer.ownerId?.toString() === myId && (
          <button onClick={onServerSettings} style={{
            marginLeft: "auto", background: "none", border: "none",
            color: "#555", cursor: "pointer", fontSize: 14, padding: "2px 4px",
          }} title="Server settings">⚙</button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>

        {activeServer ? (
          <>
            <SectionLabel>Channels</SectionLabel>
            {activeServer.channels?.map(ch => {
              const room = `server_${activeServer._id}_${ch.name}`;
              return (
                <RoomRow
                  key={ch._id}
                  label={`# ${ch.name}`}
                  active={currentRoom === room}
                  onClick={() => onSwitchRoom(room)}
                />
              );
            })}
          </>
        ) : (
          <>
            <SectionLabel>Channels</SectionLabel>
            {channels.map(ch => (
              <RoomRow
                key={ch}
                label={`# ${ch}`}
                active={currentRoom === ch}
                onClick={() => onSwitchRoom(ch)}
              />
            ))}

            {/* Direct Messages */}
            <SectionLabel extra={
              <button
                onClick={() => setShowAddFriend(true)}
                title="Add friend"
                style={addBtnStyle}
              >+</button>
            }>
              Direct messages
              {friendRequests.length > 0 && (
                <span style={{
                  marginLeft: 6, background: "#E24B4A", color: "#fff",
                  borderRadius: 9, fontSize: 10, padding: "1px 5px", fontWeight: 700,
                }}>
                  {friendRequests.length}
                </span>
              )}
            </SectionLabel>

            {/* Pending requests */}
            {friendRequests.map((req) => (
              <PendingRequest
                key={req.from._id || req.from.userId}
                request={req}
                onAccept={async () => {
                  const token = localStorage.getItem("nexchat_token");
                  await fetch(
                    `http://localhost:8080/friends/accept/${req.from._id || req.from.userId}`,
                    { method: "POST", headers: { Authorization: `Bearer ${token}` } }
                  );
                  onFriendsUpdate?.();
                }}
                onDecline={async () => {
                  const token = localStorage.getItem("nexchat_token");
                  await fetch(
                    `http://localhost:8080/friends/decline/${req.from._id || req.from.userId}`,
                    { method: "POST", headers: { Authorization: `Bearer ${token}` } }
                  );
                  onFriendsUpdate?.();
                }}
              />
            ))}

            {friends.length === 0 && friendRequests.length === 0 && (
              <p style={{ fontSize: 11, color: "#444", padding: "4px 16px", margin: 0 }}>
                No friends yet — add one with +
              </p>
            )}

            {friends.map(friend => {
              const ids = [myId, String(friend._id || friend.userId)].sort();
              const dmRoom = `dm_${ids[0]}_${ids[1]}`;
              return (
                <RoomRow
                  key={friend._id || friend.userId}
                  label={friend.username}
                  active={currentRoom === dmRoom}
                  onClick={() => onOpenDM?.({ userId: String(friend._id || friend.userId), username: friend.username })}
                  left={<Avatar user={friend} size={20} />}
                />
              );
            })}

            {/* Online now */}
            <SectionLabel>Online — {onlineUsers.length}</SectionLabel>
            {onlineUsers.map(u => (
              <div
                key={u.userId}
                onClick={() => onOpenProfile(u.username)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "5px 14px", cursor: "pointer",
                  color: "#888", fontSize: 13,
                  borderRadius: 6, margin: "1px 6px",
                }}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Avatar user={u} size={22} />
                  <div style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 7, height: 7, borderRadius: "50%",
                    background: "#4ECDC4", border: "1.5px solid #0d0d14",
                  }} />
                </div>
                <span>{u.username}</span>
              </div>
            ))}
          </>
        )}

        {/* Server members list */}
        {activeServer && (
          <>
            <SectionLabel>Members — {activeServer.members?.length}</SectionLabel>
            {activeServer.members?.map(m => {
              const memberId = m.userId?.toString?.() || String(m.userId);
              const isMe = memberId === myId;
              return (
                <div
                  key={memberId}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "5px 14px",
                    color: "#888", fontSize: 13,
                    borderRadius: 6, margin: "1px 6px",
                  }}
                >
                  <div
                    onClick={() => onOpenProfile(m.username)}
                    style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, cursor: "pointer", minWidth: 0 }}
                  >
                    <Avatar user={{ username: m.username, color: m.color }} size={22} />
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.username}
                    </span>
                    {m.role === "owner" && (
                      <span style={{ fontSize: 9, color: "#4ECDC4", fontWeight: 700, flexShrink: 0 }}>OWNER</span>
                    )}
                  </div>
                  {!isMe && (
                    <button
                      onClick={() => onOpenDM?.({ userId: memberId, username: m.username })}
                      title={`Message ${m.username}`}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#444", fontSize: 14, padding: "2px 4px",
                        borderRadius: 4, flexShrink: 0,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "#4ECDC4"}
                      onMouseLeave={e => e.currentTarget.style.color = "#444"}
                    >
                      💬
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "10px 14px",
        borderTop: "1px solid #1e1e2e",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 8,
      }}>
        <div
          onClick={() => onOpenProfile(username)}
          style={{ display: "flex", alignItems: "center", gap: 8,
            cursor: "pointer", flex: 1, minWidth: 0 }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar user={me} size={28} />
            <div style={{
              position: "absolute", bottom: 0, right: 0,
              width: 8, height: 8, borderRadius: "50%",
              background: "#4ECDC4", border: "2px solid #0d0d14",
            }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, color: "#e0e0e0", fontWeight: 500,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {username}
            </div>
            <div style={{ fontSize: 10, color: "#4ECDC4" }}>
              {status === "connected" ? "● LIVE" : "○ offline"}
            </div>
          </div>
        </div>
        <button onClick={onLogout} title="Logout" style={logoutBtnStyle}>↩</button>
      </div>

      {showAddFriend && (
        <FriendRequest
          onClose={() => setShowAddFriend(false)}
          onSent={onFriendsUpdate}
        />
      )}
    </aside>
  );
}

function SectionLabel({ children, extra }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 16px 4px",
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
      color: "#555", textTransform: "uppercase",
    }}>
      <span style={{ display: "flex", alignItems: "center" }}>{children}</span>
      {extra}
    </div>
  );
}

function RoomRow({ label, active, onClick, left }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "6px 14px", cursor: "pointer",
      borderRadius: 6, margin: "1px 6px",
      background: active ? "#1a1a2e" : "transparent",
      color: active ? "#4ECDC4" : "#666",
      fontSize: 13, fontWeight: active ? 600 : 400,
      transition: "background 0.15s",
    }}>
      {left}
      <span>{label}</span>
    </div>
  );
}

function PendingRequest({ request, onAccept, onDecline }) {
  return (
    <div style={{
      margin: "2px 8px", padding: "8px 10px",
      background: "#13131f", border: "1px solid #2a2a3e",
      borderRadius: 8, fontSize: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <Avatar user={request.from} size={18} />
        <span style={{ color: "#ccc", fontWeight: 600 }}>{request.from.username}</span>
        <span style={{ color: "#555", fontSize: 11 }}>wants to be friends</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onAccept} style={{
          flex: 1, padding: "4px 0", fontSize: 11, cursor: "pointer",
          borderRadius: 5, border: "none",
          background: "#4ECDC4", color: "#0d0d14", fontWeight: 700,
        }}>Accept</button>
        <button onClick={onDecline} style={{
          flex: 1, padding: "4px 0", fontSize: 11, cursor: "pointer",
          borderRadius: 5, background: "none", color: "#555",
          border: "1px solid #2a2a3e",
        }}>Decline</button>
      </div>
    </div>
  );
}

const addBtnStyle = {
  background: "none", border: "none", cursor: "pointer",
  color: "#555", fontSize: 16, padding: "0 2px",
  lineHeight: 1, borderRadius: 4,
};
const logoutBtnStyle = {
  background: "none", border: "none", cursor: "pointer",
  color: "#444", fontSize: 15, padding: "4px 6px",
  borderRadius: 4, flexShrink: 0,
};