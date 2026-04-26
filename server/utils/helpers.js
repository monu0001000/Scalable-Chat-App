const crypto = require("crypto");

const USER_COLORS = [
  "#FF6B6B","#4ECDC4","#45B7D1","#96CEB4",
  "#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F",
  "#BB8FCE","#85C1E9","#82E0AA","#F0B27A",
];

const genId = () => crypto.randomBytes(4).toString("hex");

const colorFor = (id) =>
  USER_COLORS[parseInt(id.slice(0, 2), 16) % USER_COLORS.length];

module.exports = { genId, colorFor, USER_COLORS };