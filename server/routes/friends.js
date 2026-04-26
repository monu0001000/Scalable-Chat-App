const express = require("express");
const router  = express.Router();
const User    = require("../models/User");
const requireAuth = require("../middleware/auth");
const { getSocketByUserId } = require("../websocket/rooms");

router.get("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate("friends", "_id username color avatarUrl");
    res.json({ friends: user.friends });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/requests", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate("friendRequests.from", "username color avatarUrl");
    res.json({ requests: user.friendRequests });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/request/:username", requireAuth, async (req, res) => {
  try {
    const target = await User.findOne({ username: req.params.username });
    if (!target) return res.status(404).json({ error: "User not found" });
    if (target._id.equals(req.user.id))
      return res.status(400).json({ error: "Cannot add yourself" });

    if (target.friends.some(id => id.equals(req.user.id)))
      return res.status(400).json({ error: "Already friends" });

    if (target.friendRequests.some(r => r.from.equals(req.user.id)))
      return res.status(400).json({ error: "Request already sent" });

    target.friendRequests.push({ from: req.user.id });
    await target.save();

    const sender = await User.findById(req.user.id, "username color avatarUrl");
    const targetSocket = getSocketByUserId(target._id.toString());
    if (targetSocket) {
      targetSocket.send(JSON.stringify({
        type: "friend_request",
        from: {
          _id:       sender._id,
          userId:    sender._id,
          username:  sender.username,
          color:     sender.color,
          avatarUrl: sender.avatarUrl,
        },
        timestamp: new Date().toISOString(),
      }));
    }

    res.json({ message: "Friend request sent" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/accept/:userId", requireAuth, async (req, res) => {
  try {
    const me     = await User.findById(req.user.id);
    const sender = await User.findById(req.params.userId);
    if (!sender) return res.status(404).json({ error: "User not found" });

    const reqIndex = me.friendRequests.findIndex(r =>
      r.from.equals(req.params.userId)
    );
    if (reqIndex === -1)
      return res.status(400).json({ error: "No request from this user" });

    me.friendRequests.splice(reqIndex, 1);
    if (!me.friends.some(id => id.equals(sender._id))) me.friends.push(sender._id);
    if (!sender.friends.some(id => id.equals(me._id))) sender.friends.push(me._id);
    await Promise.all([me.save(), sender.save()]);

    res.json({ message: "Friend added" });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/decline/:userId", requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    const reqIndex = me.friendRequests.findIndex(r =>
      r.from.equals(req.params.userId)
    );
    if (reqIndex === -1)
      return res.status(400).json({ error: "No request from this user" });

    me.friendRequests.splice(reqIndex, 1);
    await me.save();
    res.json({ message: "Request declined" });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:userId", requireAuth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id,
      { $pull: { friends: req.params.userId } }
    );
    await User.findByIdAndUpdate(req.params.userId,
      { $pull: { friends: req.user.id } }
    );
    res.json({ message: "Friend removed" });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;