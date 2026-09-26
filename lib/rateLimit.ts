import { NextResponse } from 'next/server';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStore>();

// Clean up stale IP records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (record.resetTime <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function checkRateLimit(request: Request, limit = 20, windowMs = 60 * 1000): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             '127.0.0.1';

  const route = new URL(request.url).pathname;
  const key = `${ip}:${route}`;
  const now = Date.now();

  const record = store.get(key);

  if (!record || record.resetTime <= now) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return null;
  }

  if (record.count >= limit) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { 
        status: 429, 
        headers: {
          'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
        }
      }
    );
  }

  record.count += 1;
  return null;
}
