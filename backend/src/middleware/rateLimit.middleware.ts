import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';

/**
 * Redis-backed rate limiter middleware factory.
 *
 * How it works:
 *   1. Build a key: "rl:<routeTag>:<clientIP>"
 *   2. INCR the counter in Redis (atomic, thread-safe)
 *   3. On first request, set TTL (windowMs) via PEXPIRE
 *   4. If count > max → 429 Too Many Requests with Retry-After header
 *
 * Why Redis:
 *   - Counters survive server restarts
 *   - Works across multiple server instances (horizontal scaling)
 *   - INCR is atomic → no race conditions
 */

interface RateLimitOptions {
    /** Route identifier used in the Redis key, e.g. "login" */
    tag: string;
    /** Max allowed requests in the window */
    max: number;
    /** Window duration in milliseconds */
    windowMs: number;
    /** Human-readable label for error messages */
    message?: string;
}

export const createRateLimiter = (opts: RateLimitOptions) => {
    const { tag, max, windowMs, message } = opts;
    const windowSec = Math.ceil(windowMs / 1000);

    return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        // Use forwarded IP (behind proxies/Nginx) or fallback to direct connection
        const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()
            || req.socket.remoteAddress
            || 'unknown';

        const key = `rl:${tag}:${ip}`;

        try {
            // INCR is atomic — safe across concurrent requests
            const count = await redisClient.incr(key);

            // Set TTL only on the FIRST request in the window (count === 1)
            if (count === 1) {
                await redisClient.expire(key, windowSec);
            }

            // Get TTL for Retry-After header
            const ttl = await redisClient.ttl(key);

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
        } catch (err) {
            // If Redis is down, fail open (don't block the user)
            console.error('Rate limiter Redis error:', err);
            next();
        }
    };
};

// ── Pre-built limiters ─────────────────────────────────────────────────────────

/** Strict: 5 attempts per minute — for login & register */
export const authRateLimiter = createRateLimiter({
    tag: 'auth',
    max: 5,
    windowMs: 60 * 1000,
    message: 'Too many login attempts. Please wait 1 minute and try again.',
});

/** Moderate: 10 attempts per minute — for checkout / order creation */
export const checkoutRateLimiter = createRateLimiter({
    tag: 'checkout',
    max: 10,
    windowMs: 60 * 1000,
    message: 'Too many checkout attempts. Please slow down.',
});

/** Light: 30 per minute — for general API routes */
export const generalRateLimiter = createRateLimiter({
    tag: 'general',
    max: 30,
    windowMs: 60 * 1000,
});
