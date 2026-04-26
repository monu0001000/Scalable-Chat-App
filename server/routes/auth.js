const express = require("express");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const { colorFor, genId } = require("../utils/helpers");

const router = express.Router();
const BCRYPT_ROUNDS = 10;

// ── POST /auth/register ───────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: "Username and password required" });
    if (username.length < 2 || username.length > 24)
      return res.status(400).json({ error: "Username must be 2–24 characters" });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const existing = await User.findOne({ username });
    if (existing)
      return res.status(409).json({ error: "Username already taken" });

    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const color  = colorFor(genId());
    const user   = await User.create({ username, password: hashed, color });

    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username, color: user.color },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || "7d" }
    );

    console.log(`[auth] registered: ${username}`);
    return res.status(201).json({ token, username: user.username, color: user.color });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ── POST /auth/login ──────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: "Username and password required" });

    const user = await User.findOne({ username });
    if (!user)
      return res.status(401).json({ error: "Invalid username or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: "Invalid username or password" });

    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username, color: user.color },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || "7d" }
    );

    console.log(`[auth] login: ${username}`);
    return res.status(200).json({ token, username: user.username, color: user.color });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;