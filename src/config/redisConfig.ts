import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.CACHE_DB_URL,
});

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});
