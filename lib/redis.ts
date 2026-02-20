import { Redis, RedisOptions } from "ioredis";

const redisOptions: RedisOptions = {
    maxRetriesPerRequest: null,
};

const getRedisUrl = () => {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }
    return "redis://localhost:6379";
};

let redisConnection: Redis;

export const getRedisConnection = () => {
    if (!redisConnection) {
        redisConnection = new Redis(getRedisUrl(), redisOptions);

        redisConnection.on("error", (error) => {
            console.error("Redis connection error:", error);
        });
    }
    return redisConnection;
};
