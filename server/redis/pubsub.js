const Redis = require("ioredis");
const { deliverLocally } = require("../websocket/rooms");

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  throw new Error("REDIS_URL is not set in environment");
}

const redisOptions = {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  tls: REDIS_URL.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
};

const publisher  = new Redis(REDIS_URL, redisOptions);
const subscriber = new Redis(REDIS_URL, redisOptions);



let redisReady = false;


const subscribedRooms = new Set();

publisher.on("connect", () => {
  redisReady = true;
  console.log("[redis] publisher connected");
});

publisher.on("error", (e) => {
  redisReady = false;
  console.error("[redis] publisher error:", e.message);
});

subscriber.on("connect", () => console.log("[redis] subscriber connected"));
subscriber.on("error", (e) => console.error("[redis] subscriber error:", e.message));

//  ENSURE THIS RUNS ONLY ONCE
if (!subscriber.listenerCount("message")) {
  subscriber.on("message", (channel, data) => {
    let payload;
    try {
      payload = JSON.parse(data);
    } catch {
      return;
    }

    const roomId = channel.replace(/^room:/, "");
    const excludeId = payload._senderId || null;

    deliverLocally(roomId, payload, excludeId);
  });
}

const redisChannel = (roomId) => `room:${roomId}`;

const publish = (roomId, payload) =>
  publisher.publish(redisChannel(roomId), JSON.stringify(payload));

//   (NO DUPLICATES)
const subscribeRoom = (roomId) => {
  const channel = redisChannel(roomId);

  if (subscribedRooms.has(channel)) return;

  subscriber.subscribe(channel, (err) => {
    if (err) {
      console.error(`[redis] subscribe error for ${roomId}:`, err.message);
      return;
    }

    subscribedRooms.add(channel);
    console.log(`[redis] subscribed to ${channel}`);
  });
};

// 🔥 CLEAN UNSUBSCRIBE
const unsubscribeRoom = (roomId) => {
  const channel = redisChannel(roomId);

  if (!subscribedRooms.has(channel)) return;

  subscriber.unsubscribe(channel, (err) => {
    if (err) {
      console.error(`[redis] unsubscribe error for ${roomId}:`, err.message);
      return;
    }

    subscribedRooms.delete(channel);
    console.log(`[redis] unsubscribed from ${channel}`);
  });
};

const isReady = () => redisReady;

module.exports = {
  publisher,
  subscriber,
  publish,
  subscribeRoom,
  unsubscribeRoom,
  redisChannel,
  isReady,
};