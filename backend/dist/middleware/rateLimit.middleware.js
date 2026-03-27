"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalRateLimiter = exports.checkoutRateLimiter = exports.authRateLimiter = exports.createRateLimiter = void 0;
const redis_1 = require("../config/redis");
const createRateLimiter = (opts) => {
    const { tag, max, windowMs, message } = opts;
    const windowSec = Math.ceil(windowMs / 1000);
    return async (req, res, next) => {
        // Use forwarded IP (behind proxies/Nginx) or fallback to direct connection
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim()
            || req.socket.remoteAddress
            || 'unknown';
        const key = `rl:${tag}:${ip}`;
        try {
            // INCR is atomic — safe across concurrent requests
            const count = await redis_1.redisClient.incr(key);
            // Set TTL only on the FIRST request in the window (count === 1)
            if (count === 1) {
                await redis_1.redisClient.expire(key, windowSec);
            }
            // Get TTL for Retry-After header
            const ttl = await redis_1.redisClient.ttl(key);
            // Always expose rate limit headers
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
            res.setHeader('X-RateLimit-Reset', Date.now() + ttl * 1000);
            if (count > max) {
                res.setHeader('Retry-After', ttl);
                return res.status(429).json({
                    message: message ?? `Too many requests. Please wait ${ttl}s before trying again.`,
                    retryAfter: ttl,
                });
            }
            next();
        }
        catch (err) {
            // If Redis is down, fail open (don't block the user)
            console.error('Rate limiter Redis error:', err);
            next();
        }
    };
};
exports.createRateLimiter = createRateLimiter;
// ── Pre-built limiters ─────────────────────────────────────────────────────────
/** Strict: 5 attempts per minute — for login & register */
exports.authRateLimiter = (0, exports.createRateLimiter)({
    tag: 'auth',
    max: 5,
    windowMs: 60 * 1000,
    message: 'Too many login attempts. Please wait 1 minute and try again.',
});
/** Moderate: 10 attempts per minute — for checkout / order creation */
exports.checkoutRateLimiter = (0, exports.createRateLimiter)({
    tag: 'checkout',
    max: 10,
    windowMs: 60 * 1000,
    message: 'Too many checkout attempts. Please slow down.',
});
/** Light: 30 per minute — for general API routes */
exports.generalRateLimiter = (0, exports.createRateLimiter)({
    tag: 'general',
    max: 30,
    windowMs: 60 * 1000,
});
//# sourceMappingURL=rateLimit.middleware.js.map