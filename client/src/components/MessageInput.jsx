import { useState, useRef } from "react";

export default function MessageInput({ onSend, onTyping, disabled }) {
  const [text,      setText]      = useState("");
  const [imageUrl,  setImageUrl]  = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview,   setPreview]   = useState(null);
  const typingTimeout = useRef(null);
  const isTyping      = useRef(false);
  const fileRef       = useRef();

  const handleChange = (val) => {
    setText(val);
    if (!isTyping.current) { isTyping.current = true; onTyping(true); }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTyping.current = false;
      onTyping(false);
    }, 2000);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const token = localStorage.getItem("nexchat_token");
      const form  = new FormData();
      form.append("file", file);
      const res  = await fetch("http://localhost:8080/upload", {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImageUrl(data.url);
    } catch (e) {
      console.error("Upload failed:", e.message);
      setPreview(null);
      setImageUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setImageUrl(null);
    setPreview(null);
    fileRef.current.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !imageUrl) || disabled || uploading) return;
    onSend(trimmed, imageUrl);
    setText("");
    clearImage();
    clearTimeout(typingTimeout.current);
    isTyping.current = false;
    onTyping(false);
  };

  const canSend = (text.trim().length > 0 || imageUrl) && !disabled && !uploading;

  return (
    <form
      onSubmit={handleSubmit}
      style={{ padding: "10px 20px 16px", borderTop: "1px solid #1e1e2e" }}
    >
      {/* Image preview */}
      {preview && (
        <div style={{
          marginBottom: 8, position: "relative", display: "inline-block",
        }}>
          <img src={preview} alt="preview" style={{
            maxHeight: 80, maxWidth: 140, borderRadius: 8,
            objectFit: "cover", border: "1px solid #2a2a3a",
            opacity: uploading ? 0.5 : 1,
          }} />
          {uploading && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 11, color: "#4ECDC4",
            }}>uploading…</div>
          )}
          {!uploading && (
            <button onClick={clearImage} type="button" style={{
              position: "absolute", top: -6, right: -6,
              width: 18, height: 18, borderRadius: "50%",
              background: "#FF6B6B", border: "none", color: "#fff",
              fontSize: 11, cursor: "pointer", lineHeight: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        {/* Attachment button */}
        <button
          type="button"
          onClick={() => fileRef.current.click()}
          disabled={disabled || uploading}
          title="Attach image"
          style={{
            width: 40, height: 40, borderRadius: 8, flexShrink: 0,
            background: "#0d0d14", border: "1px solid #1e1e2e",
            color: "#555", fontSize: 18, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#4ECDC4"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e2e"}
        >
          📎
        </button>
        <input
          ref={fileRef} type="file"
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        <input
          value={text}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSubmit(e)}
          placeholder={disabled ? "Connecting…" : uploading ? "Uploading…" : "Type a message…"}
          disabled={disabled}
          style={{
            flex: 1, padding: "10px 14px",
            background: "#0d0d14", border: "1px solid #1e1e2e",
            borderRadius: 8, color: "#fff", fontSize: 14,
            fontFamily: "inherit", outline: "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
            opacity: disabled ? 0.5 : 1,
          }}
          onFocus={e => { e.target.style.borderColor = "#4ECDC4"; e.target.style.boxShadow = "0 0 0 2px #4ECDC418"; }}
          onBlur={e  => { e.target.style.borderColor = "#1e1e2e"; e.target.style.boxShadow = "none"; }}
        />

        <button
          type="submit"
          disabled={!canSend}
          style={{
            padding: "10px 18px",
            background: canSend ? "#4ECDC4" : "#16161e",
            border: `1px solid ${canSend ? "#4ECDC4" : "#2a2a3a"}`,
            borderRadius: 8, color: canSend ? "#0a0a0f" : "#333",
            fontWeight: 700, fontSize: 11, letterSpacing: 2,
            cursor: canSend ? "pointer" : "default",
            fontFamily: "inherit", transition: "all 0.2s", flexShrink: 0,
          }}
        >
          SEND
        </button>
      </div>
    </form>
  );
}