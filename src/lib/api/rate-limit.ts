/**
 * Rate Limiting Utility
 * 
 * Provides in-memory rate limiting for API routes.
 * Uses a sliding window algorithm with configurable limits.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Optional key generator function (defaults to IP-based) */
  keyGenerator?: (request: NextRequest) => string;
  /** Optional message for rate limit exceeded */
  message?: string;
}

/**
 * Rate limit entry stored in memory
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory store for rate limit entries
 * Note: In production with multiple instances, use Redis or similar
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Default key generator using IP address
 */
function defaultKeyGenerator(request: NextRequest): string {
  // Try various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnecting = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (cfConnecting) {
    return cfConnecting;
  }
  
  // Fallback to a default key (should not happen in production)
  return 'unknown-ip';
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Check rate limit for a request
 * 
 * @param request - The Next.js request object
 * @param config - Rate limit configuration
 * @returns Rate limit result with status information
 */
export function checkRateLimit(
  request: NextRequest, 
  config: RateLimitConfig
): RateLimitResult {
  const key = (config.keyGenerator || defaultKeyGenerator)(request);
  const now = Date.now();
  const resetTime = now + config.windowMs;
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    // No entry or expired - create new entry
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetTime
    };
  }
  
  if (entry.count >= config.limit) {
    // Rate limit exceeded
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    };
  }
  
  // Increment count
  entry.count++;
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitExceededResponse(
  result: RateLimitResult,
  message: string = 'Too many requests, please try again later'
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: result.retryAfter
    },
    { 
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
        'Retry-After': String(result.retryAfter || 60)
      }
    }
  );
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));
  return response;
}

/**
 * Preset rate limit configurations
 */
export const rateLimitPresets = {
  /** Standard API rate limit - 100 requests per minute */
  standard: { limit: 100, windowMs: 60000 },
  /** Strict rate limit for sensitive operations - 20 requests per minute */
  strict: { limit: 20, windowMs: 60000 },
  /** Relaxed rate limit for read operations - 300 requests per minute */
  relaxed: { limit: 300, windowMs: 60000 },
  /** Very strict for auth endpoints - 5 requests per minute */
  auth: { limit: 5, windowMs: 60000 },
} as const;

/**
 * Higher-order function to wrap API route handlers with rate limiting
 * 
 * @example
 * ```typescript
 * export const GET = withRateLimit(
 *   async (request) => { ... },
 *   rateLimitPresets.standard
 * );
 * ```
 */
export function withRateLimit<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  config: RateLimitConfig
): (request: NextRequest, ...args: T) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: T) => {
    const result = checkRateLimit(request, config);
    
    if (!result.success) {
      return rateLimitExceededResponse(result, config.message);
    }
    
    const response = await handler(request, ...args);
    return addRateLimitHeaders(response, result);
  };
}
