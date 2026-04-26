require("dotenv").config();
const friendsRouter = require("./routes/friends");
const express      = require("express");
const cors         = require("cors");
const mongoose     = require("mongoose");
const connectDB    = require("./config/db");
const authRoutes   = require("./routes/auth");
const userRoutes   = require("./routes/users");
const initWsServer = require("./websocket/wsServer");
const { isReady: redisReady } = require("./redis/pubsub");
const Message      = require("./models/Message");
const serversRouter = require("./routes/servers");
const { rooms }    = require("./websocket/rooms");
const uploadRouter = require("./routes/upload");
const messagesRouter = require("./routes/messages");  // ← ADD THIS

const PORT = process.env.PORT || 8080;

const app = express();
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/auth",     authRoutes);
app.use("/users",    userRoutes);
app.use("/friends",  friendsRouter);
app.use("/servers",  serversRouter);
app.use("/upload",   uploadRouter);
app.use("/messages", messagesRouter);  // ← ADD THIS

app.get("/health", async (req, res) => {
  const msgCount = await Message.countDocuments().catch(() => -1);
  res.json({
    status:         "ok",
    redis:          redisReady() ? "connected" : "disconnected",
    mongo:          mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    rooms:          Array.from(rooms.keys()),
    storedMessages: msgCount,
    uptime:         Math.floor(process.uptime()),
  });
});

app.use((req, res) => res.status(404).json({ error: "Not found" }));

// ── Boot ──────────────────────────────────────────────────────────────────────
const boot = async () => {
  await connectDB();

  const httpServer = app.listen(PORT, () => {
    console.log("╔══════════════════════════════════════╗");
    console.log(`║  NexChat Server                      ║`);
    console.log(`║  http://localhost:${PORT}            ║`);
    console.log(`║  ws://localhost:${PORT}              ║`);
    console.log("╚══════════════════════════════════════╝");
  });

  const wss = initWsServer(httpServer);

  const shutdown = async () => {
    console.log("\n[server] shutting down...");
    wss.close(async () => {
      await mongoose.disconnect();
      const { publisher, subscriber } = require("./redis/pubsub");
      publisher.quit();
      subscriber.quit();
      httpServer.close(() => process.exit(0));
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT",  shutdown);
};

boot().catch((err) => {
  console.error("[boot] failed:", err.message);
  process.exit(1);
});