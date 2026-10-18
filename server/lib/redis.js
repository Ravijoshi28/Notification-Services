import dotenv from "dotenv";
import IORedis from "ioredis";

dotenv.config({ quiet: true });

export function createRedis(url = process.env.REDIS_URL) {
  if (!url) throw new Error("Set REDIS_URL in server/.env first.");

  const redis = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  redis.on("error", (error) => {
    console.error("Redis error:", error.message);
  });

  return redis;
}

export const redis = createRedis();
