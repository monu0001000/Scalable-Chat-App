const express     = require("express");
const router      = express.Router();
const requireAuth = require("../middleware/auth");
const { uploadAvatar } = require("../config/cloudinary");

router.post("/", requireAuth, uploadAvatar.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ url: req.file.path });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;