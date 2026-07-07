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
        // No retries: this runs in middleware on every request — a dead or
        // unreachable instance must fail fast, not after 5 backoff attempts.
        retry: false,
    })
    : null;

// Mock rate limiter for local development without Upstash
const mockLimit = async () => ({
    success: true,
    limit: 0,
    reset: 0,
    remaining: 0,
});

// Rate limiting is best-effort: if Upstash is unreachable (dead instance,
// network issue), allow the request instead of taking down every API route —
// this runs in middleware, so an unhandled error here 500s the whole app.
// After a failure the limiter is skipped entirely for a cooldown window so
// requests don't each pay the connection-failure latency.
const CIRCUIT_OPEN_MS = 60_000;
let circuitOpenUntil = 0;

const failOpen = (limiter: Ratelimit): Ratelimit => {
    return {
        limit: async (key: string) => {
            if (Date.now() < circuitOpenUntil) {
                return mockLimit();
            }
            try {
                return await limiter.limit(key);
            } catch (error) {
                circuitOpenUntil = Date.now() + CIRCUIT_OPEN_MS;
                console.error(
                    `Rate limiter unavailable — allowing requests without limits for ${CIRCUIT_OPEN_MS / 1000}s:`,
                    error instanceof Error ? error.message : error
                );
                return mockLimit();
            }
        },
    } as unknown as Ratelimit;
};

export const globalRateLimit = redis
    ? failOpen(
        new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(50, "10 s"),
            analytics: true,
            prefix: "@upstash/ratelimit/global",
        })
    )
    : ({ limit: mockLimit } as unknown as Ratelimit);

export const strictRateLimit = redis
    ? failOpen(
        new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(5, "60 s"),
            analytics: true,
            prefix: "@upstash/ratelimit/strict",
        })
    )
    : ({ limit: mockLimit } as unknown as Ratelimit);
