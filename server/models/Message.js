const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  msgId:     { type: String, required: true, unique: true },
  room:      { type: String, required: true, index: true },
  userId:    { type: String, required: true },
  username:  { type: String, required: true },
  color:     { type: String, required: true },
  text:      { type: String, default: "" },
  imageUrl:  { type: String, default: "" },
  reactions: { type: Map, of: [String], default: {} },
  timestamp: { type: Number, required: true },
});

messageSchema.index({ room: 1, timestamp: -1 });

module.exports = mongoose.model("Message", messageSchema);