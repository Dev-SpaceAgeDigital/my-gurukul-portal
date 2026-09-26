import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── In-Memory Sliding Window Rate Limiter ──────────────────────────
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((entry, ip) => {
      if (now > entry.resetTime) {
        rateLimitMap.delete(ip);
      }
    });
  }, 5 * 60 * 1000);
}

export interface PublicApiOptions {
  /** Maximum allowed requests per IP within the time window (default: 100) */
  maxRequests?: number;
  /** Window size in milliseconds (default: 60,000 ms = 1 minute) */
  windowMs?: number;
  /** Cache duration in seconds for CDN and browser (default: 60 seconds) */
  cacheSeconds?: number;
}

const DEFAULT_OPTIONS: PublicApiOptions = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  cacheSeconds: 60,
};

/**
 * Reusable CORS & Caching headers for public endpoints
 */
export function getPublicHeaders(cacheSeconds = 60) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    'Cache-Control': `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 5}`,
    'X-Content-Type-Options': 'nosniff',
  };
}

/**
 * Checks if an IP has exceeded the rate limit.
 */
function checkRateLimit(
  ip: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs;
    rateLimitMap.set(ip, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, reset: resetTime };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, reset: entry.resetTime };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count, reset: entry.resetTime };
}

/**
 * Higher-order wrapper for Public API routes.
 * Automatically applies CORS, Caching, Rate Limiting, and Error Sanitization.
 * 
 * @example
 * export const GET = withPublicApi(async (req) => {
 *   const data = await db.select().from(schools);
 *   return NextResponse.json(data);
 * }, { maxRequests: 60, cacheSeconds: 120 });
 */
export function withPublicApi(
  handler: (req: NextRequest) => Promise<NextResponse | Response>,
  options: PublicApiOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return async function (req: NextRequest) {
    // 1. Handle CORS Preflight OPTIONS requests immediately
    if (req.method === 'OPTIONS') {
      return NextResponse.json({}, { headers: getPublicHeaders(opts.cacheSeconds) });
    }

    // 2. Extract caller IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    // 3. Rate Limiting Check
    const { allowed, remaining, reset } = checkRateLimit(ip, opts.maxRequests!, opts.windowMs!);
    const headers = {
      ...getPublicHeaders(opts.cacheSeconds),
      'X-RateLimit-Limit': opts.maxRequests!.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(reset).toISOString(),
    };

    if (!allowed) {
      const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too Many Requests. Please try again later.' },
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': retryAfterSeconds.toString(),
          },
        }
      );
    }

    // 4. Execute Route Handler with Error Sanitization
    try {
      const response = await handler(req);

      // Attach public caching and rate-limit headers to the successful response
      Object.entries(headers).forEach(([key, val]) => {
        response.headers.set(key, val);
      });

      return response;
    } catch (error: any) {
      console.error(`[Public API Error] ${req.nextUrl?.pathname || 'unknown route'}:`, error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500, headers }
      );
    }
  };
}
