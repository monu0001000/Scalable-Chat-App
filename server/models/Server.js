const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  color:    { type: String, default: "#4ECDC4" },
  role:     { type: String, enum: ["owner", "member"], default: "member" },
  joinedAt: { type: Date, default: Date.now },
});

const channelSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const inviteSchema = new mongoose.Schema({
  code:      { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  expiresAt: { type: Date, required: true },
  maxUses:   { type: Number, default: 10 },
  uses:      { type: Number, default: 0 },
});

const serverSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true, maxlength: 50 },
  iconUrl:   { type: String, default: "" },
  iconColor: { type: String, default: "#4ECDC4" },
  ownerId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members:   [memberSchema],
  channels:  [channelSchema],
  invites:   [inviteSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Server", serverSchema);