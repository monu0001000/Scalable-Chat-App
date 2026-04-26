const mongoose = require("mongoose");

const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    console.error("[db] MONGO_URI is not set. Check your .env file.");
    process.exit(1);
  }

  console.log("[mongo] connecting...");
  await mongoose.connect(MONGO_URI);
  console.log("[mongo] connected ✓");
};

module.exports = connectDB;