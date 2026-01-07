/**
 * Simple in-memory rate limiter using sliding window algorithm
 * For production với nhiều instances, nên dùng Redis
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (sẽ reset khi server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries mỗi 5 phút
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Số request tối đa trong window */
  limit: number;
  /** Thời gian window (milliseconds) */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
}

/**
 * Check rate limit cho một identifier (API key, IP, etc.)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  let entry = rateLimitStore.get(key);

  // Nếu không có entry hoặc đã hết window -> reset
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Tăng count
  entry.count++;

  const remaining = Math.max(0, config.limit - entry.count);
  const success = entry.count <= config.limit;

  return {
    success,
    limit: config.limit,
    remaining,
    resetAt: entry.resetAt,
    retryAfterSeconds: success
      ? undefined
      : Math.ceil((entry.resetAt - now) / 1000),
  };
}

/**
 * Get rate limit headers để thêm vào response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.floor(result.resetAt / 1000).toString(),
    ...(result.retryAfterSeconds && {
      "Retry-After": result.retryAfterSeconds.toString(),
    }),
  };
}

// Default config: 100 requests per minute
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  limit: 100,
  windowMs: 60 * 1000, // 1 minute
};

// Strict config: 20 requests per minute (cho endpoints nhạy cảm)
export const STRICT_RATE_LIMIT: RateLimitConfig = {
  limit: 20,
  windowMs: 60 * 1000,
};
