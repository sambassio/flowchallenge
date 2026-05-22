import { Redis } from "@upstash/redis";

export function createRedis(): Redis | null {
  try {
    return Redis.fromEnv();
  } catch {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    return new Redis({ url, token });
  }
}
