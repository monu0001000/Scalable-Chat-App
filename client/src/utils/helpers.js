export const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const formatDate = (ts) => {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

export const sanitize = (str, max = 200) =>
  String(str || "").slice(0, max).trim();

export const slugify = (str) =>
  String(str || "general")
    .slice(0, 32).trim().toLowerCase().replace(/\s+/g, "-") || "general";
