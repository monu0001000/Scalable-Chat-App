const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  color:    { type: String, default: "#888" },
  bio:      { type: String, default: "" },
  avatarUrl:{ type: String, default: "" },
  friends:  [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  friendRequests: [
    {
      from:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      sentAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);