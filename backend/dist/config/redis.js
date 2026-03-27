"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CART_TTL = exports.redisClient = void 0;
exports.connectRedis = connectRedis;
const redis_1 = require("redis");
// Create a Redis client that points to the Docker container
exports.redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
exports.redisClient.on('error', (err) => console.log('Redis Client Error', err));
exports.redisClient.on('connect', () => console.log('Redis Connected Successfully'));
// Define standard TTL for cart expiration (e.g. 7 days in seconds)
exports.CART_TTL = 60 * 60 * 24 * 7;
async function connectRedis() {
    if (!exports.redisClient.isOpen) {
        await exports.redisClient.connect();
    }
}
//# sourceMappingURL=redis.js.map