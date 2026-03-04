import { createClient } from 'redis';

// Create a Redis client that points to the Docker container
export const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Connected Successfully'));

// Define standard TTL for cart expiration (e.g. 7 days in seconds)
export const CART_TTL = 60 * 60 * 24 * 7;

export async function connectRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
}
