import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

export const redis = redisUrl ? new Redis(redisUrl) : null;

if (redis) {
    redis.on("error", (err) => {
        console.error("[REDIS ERROR]", err);
    });

    redis.on("connect", () => {
        console.log("[REDIS] Connected successfully.");
    });
}
