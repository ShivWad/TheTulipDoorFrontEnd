/**
 * Rate Limiting Utilities
 * 
 * Simple in-memory rate limiter for API endpoints.
 * Uses a sliding window approach to track requests per IP address.
 * 
 * Features:
 * - Configurable window duration (default: 15 minutes)
 * - Configurable max requests per window (default: 5)
 * - IP-based identification using x-forwarded-for header
 * 
 * Usage:
 * ```typescript
 * import { rateLimit, getClientIp } from '@/lib/rate-limit';
 * 
 * export async function GET(request: Request) {
 *   const ip = getClientIp(request);
 *   const { success, remaining } = rateLimit(ip);
 *   
 *   if (!success) {
 *     return Response.json({ error: 'Too many requests' }, { status: 429 });
 *   }
 *   // ... handle request
 * }
 * ```
 * 
 * Note: This is a simple in-memory rate limiter suitable for development
 * and low-traffic production. For high-traffic sites, consider using
 * Redis-based solutions like @upstash/ratelimit.
 */

// In-memory store for rate limiting
// In production, consider using Redis for distributed rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/** Time window for rate limiting (15 minutes in milliseconds) */
const WINDOW_MS = 15 * 60 * 1000;

/** Maximum requests allowed per window */
const MAX_REQUESTS = 5;

/**
 * Check if request is within rate limit
 * 
 * @param identifier - Unique identifier (usually client IP)
 * @returns Object with success status and remaining requests
 * 
 * Algorithm:
 * 1. If no record exists or window expired, create new record
 * 2. If count >= max, return failure
 * 3. Otherwise, increment count and return success
 */
export function rateLimit(identifier: string): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // No record or window expired - start fresh
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return { success: true, remaining: MAX_REQUESTS - 1 };
  }

  // Rate limit exceeded
  if (record.count >= MAX_REQUESTS) {
    return { success: false, remaining: 0 };
  }

  // Increment counter
  record.count++;
  rateLimitStore.set(identifier, record);
  return { success: true, remaining: MAX_REQUESTS - record.count };
}

/**
 * Extract client IP from request headers
 * 
 * @param request - The HTTP request
 * @returns Client IP address or 'unknown' if unavailable
 * 
 * Handles:
 * - x-forwarded-for header (for proxied requests)
 * - Falls back to 'unknown' if no header
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip;
}
