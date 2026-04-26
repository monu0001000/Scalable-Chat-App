const express     = require("express");
const User        = require("../models/User");
const requireAuth = require("../middleware/auth");
const { uploadAvatar } = require("../config/cloudinary");

const router = express.Router();

// ── GET /users/:username — public profile ─────────────────────────────────────
router.get("/:username", async (req, res) => {
  try {
    const user = await User.findOne(
      { username: req.params.username },
      { password: 0 }   // never return password
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
       _id:       user._id,  
      username:  user.username,
      color:     user.color,
      bio:       user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── PUT /users/profile — update bio (auth required) ───────────────────────────
router.put("/profile", requireAuth, async (req, res) => {
  try {
    const { bio } = req.body;

    if (typeof bio !== "string")
      return res.status(400).json({ error: "Bio must be a string" });
    if (bio.length > 150)
      return res.status(400).json({ error: "Bio must be under 150 characters" });

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { bio: bio.trim() },
      { new: true, select: "-password" }
    );

    res.json({
      username:  user.username,
      color:     user.color,
      bio:       user.bio,
      avatarUrl: user.avatarUrl,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── PUT /users/avatar — upload avatar to Cloudinary (auth required) ───────────
router.put("/avatar", requireAuth, uploadAvatar.single("avatar"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No file uploaded" });

    const avatarUrl = req.file.path; // Cloudinary URL

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { avatarUrl },
      { new: true, select: "-password" }
    );

    console.log(`[avatar] updated for ${user.username}: ${avatarUrl}`);
    res.json({
      username:  user.username,
      color:     user.color,
      bio:       user.bio,
      avatarUrl: user.avatarUrl,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



module.exports = router;