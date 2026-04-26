const express     = require("express");
const router      = express.Router();
const Message     = require("../models/Message");
const requireAuth = require("../middleware/auth");
const { getSocketByUserId } = require("../websocket/rooms");
const { users } = require("../websocket/rooms");

router.put("/:msgId/react", requireAuth, async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ error: "Emoji required" });

    const message = await Message.findOne({ msgId: req.params.msgId });
    if (!message) return res.status(404).json({ error: "Message not found" });

    const reactions = message.reactions || new Map();
    const current   = reactions.get(emoji) || [];
    const userId    = req.user.userId;

    // Toggle — add if not there, remove if already reacted
    if (current.includes(userId)) {
      reactions.set(emoji, current.filter(id => id !== userId));
    } else {
      reactions.set(emoji, [...current, userId]);
    }

    // Clean up empty arrays
    if (reactions.get(emoji)?.length === 0) reactions.delete(emoji);

    message.reactions = reactions;
    await message.save();

    // Broadcast to everyone in the room via WS
    const reactionPayload = JSON.stringify({
      type:      "reaction",
      msgId:     message.msgId,
      reactions: Object.fromEntries(message.reactions),
      room:      message.room,
    });

    // Send to all users in the room
    for (const [ws, data] of users.entries()) {
      if (data.room === message.room && ws.readyState === 1) {
        ws.send(reactionPayload);
      }
    }

    res.json({ reactions: Object.fromEntries(message.reactions) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;