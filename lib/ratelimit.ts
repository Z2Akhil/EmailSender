import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasCredentials = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

if (!hasCredentials) {
    console.warn("⚠️ Upstash Redis environment variables are missing. Rate limiting is disabled.");
}

const redis = hasCredentials
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    : null;

// Mock rate limiter for local development without Upstash
const mockLimit = async () => ({
    success: true,
    limit: 0,
    reset: 0,
    remaining: 0,
});

export const globalRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(50, "10 s"),
        analytics: true,
        prefix: "@upstash/ratelimit/global",
    })
    : { limit: mockLimit } as unknown as Ratelimit;

export const strictRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "60 s"),
        analytics: true,
        prefix: "@upstash/ratelimit/strict",
    })
    : { limit: mockLimit } as unknown as Ratelimit;
