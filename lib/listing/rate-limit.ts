import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is not configured");
}

const parsedRedisUrl = new URL(redisUrl);
const redisToken = parsedRedisUrl.password;

if (!redisToken) {
  throw new Error("REDIS_URL must include a password component for Upstash");
}

const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

// 10 uploads per hour per user
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  analytics: true,
  prefix: "@upstash/ratelimit/listing-upload",
});

export async function checkRateLimit(userId: string): Promise<boolean> {
  const { success } = await ratelimit.limit(userId);
  return success;
}
