const express    = require("express");
const router     = express.Router();
const crypto     = require("crypto");
const Server     = require("../models/Server");
const requireAuth = require("../middleware/auth");
const { uploadAvatar } = require("../config/cloudinary");

// GET /servers — get all servers I'm a member of
router.get("/", requireAuth, async (req, res) => {
  try {
    const servers = await Server.find({
      "members.userId": req.user.userId,
    }, "name iconUrl iconColor ownerId channels members");
    res.json({ servers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /servers — create a server
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, iconColor } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Server name required" });
    if (name.length > 50) return res.status(400).json({ error: "Name too long" });

    const server = await Server.create({
      name:      name.trim(),
      iconColor: iconColor || "#4ECDC4",
      ownerId:   req.user.userId,
      members: [{
        userId:   req.user.userId,
        username: req.user.username,
        color:    req.user.color,
        role:     "owner",
      }],
      channels: [
        { name: "general" },
        { name: "random" },
      ],
    });

    res.status(201).json({ server });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /servers/:id — get single server (must be member)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });

    const isMember = server.members.some(m => m.userId.equals(req.user.userId));
    if (!isMember) return res.status(403).json({ error: "Not a member" });

    res.json({ server });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /servers/:id — delete server (owner only)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (!server.ownerId.equals(req.user.userId))
      return res.status(403).json({ error: "Only the owner can delete this server" });

    await Server.findByIdAndDelete(req.params.id);
    res.json({ message: "Server deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /servers/:id/channels — add a channel (owner only)
router.post("/:id/channels", requireAuth, async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (!server.ownerId.equals(req.user.userId))
      return res.status(403).json({ error: "Only the owner can add channels" });

    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Channel name required" });

    server.channels.push({ name: name.trim().toLowerCase().replace(/\s+/g, "-") });
    await server.save();
    res.json({ server });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /servers/:id/channels/:channelId — remove channel (owner only)
router.delete("/:id/channels/:channelId", requireAuth, async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (!server.ownerId.equals(req.user.userId))
      return res.status(403).json({ error: "Only the owner can remove channels" });
    if (server.channels.length <= 1)
      return res.status(400).json({ error: "Server must have at least one channel" });

    server.channels = server.channels.filter(
      c => !c._id.equals(req.params.channelId)
    );
    await server.save();
    res.json({ server });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /servers/:id/invites — generate invite link (owner only)
router.post("/:id/invites", requireAuth, async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (!server.ownerId.equals(req.user.userId))
      return res.status(403).json({ error: "Only the owner can create invites" });

    const { maxUses = 10, expiresInHours = 24 } = req.body;

    const code      = crypto.randomBytes(6).toString("hex"); // e.g. "a1b2c3d4e5f6"
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    server.invites.push({ code, createdBy: req.user.userId, expiresAt, maxUses });
    await server.save();

    res.json({ code, expiresAt, maxUses });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /servers/join/:code — join via invite link
router.post("/join/:code", requireAuth, async (req, res) => {
  try {
    const server = await Server.findOne({ "invites.code": req.params.code });
    if (!server) return res.status(404).json({ error: "Invalid invite link" });

    const invite = server.invites.find(i => i.code === req.params.code);

    // Check expiry
    if (new Date() > invite.expiresAt)
      return res.status(400).json({ error: "Invite link has expired" });

    // Check max uses
    if (invite.uses >= invite.maxUses)
      return res.status(400).json({ error: "Invite link has reached max uses" });

    // Already a member?
    const already = server.members.some(m => m.userId.equals(req.user.userId));
    if (already) return res.json({ server, alreadyMember: true });

    // Add member + increment uses
    server.members.push({
      userId:   req.user.userId,
      username: req.user.username,
      color:    req.user.color,
      role:     "member",
    });
    invite.uses += 1;
    await server.save();

    res.json({ server });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /servers/:id/members/:userId — kick member (owner only)
router.delete("/:id/members/:userId", requireAuth, async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (!server.ownerId.equals(req.user.userId))
      return res.status(403).json({ error: "Only the owner can kick members" });
    if (req.params.userId === req.user.userId.toString())
      return res.status(400).json({ error: "Cannot kick yourself" });

    server.members = server.members.filter(
      m => !m.userId.equals(req.params.userId)
    );
    await server.save();
    res.json({ message: "Member removed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /servers/:id/leave — leave server (non-owner)
router.post("/:id/leave", requireAuth, async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.ownerId.equals(req.user.userId))
      return res.status(400).json({ error: "Owner cannot leave — delete the server instead" });

    server.members = server.members.filter(
      m => !m.userId.equals(req.user.userId)
    );
    await server.save();
    res.json({ message: "Left server" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /servers/:id/icon — upload server icon (owner only)
router.put("/:id/icon", requireAuth, uploadAvatar.single("icon"), async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (!server.ownerId.equals(req.user.userId))
      return res.status(403).json({ error: "Only the owner can change the icon" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    server.iconUrl = req.file.path;
    await server.save();
    res.json({ iconUrl: server.iconUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;