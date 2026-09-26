import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export type RateLimitProfile =
  | 'login'
  | 'otp'
  | 'publicRead'
  | 'publicForm'
  | 'authRead'
  | 'mutation'
  | 'upload'
  | 'payment';

const profiles: Record<RateLimitProfile, { limit: number; windowSeconds: number }> = {
  login: { limit: 5, windowSeconds: 15 * 60 },
  otp: { limit: 5, windowSeconds: 15 * 60 },
  publicRead: { limit: 120, windowSeconds: 60 },
  publicForm: { limit: 10, windowSeconds: 10 * 60 },
  authRead: { limit: 180, windowSeconds: 60 },
  mutation: { limit: 40, windowSeconds: 60 },
  upload: { limit: 10, windowSeconds: 10 * 60 },
  payment: { limit: 10, windowSeconds: 15 * 60 },
};

export async function checkRateLimit(request: Request, profile: RateLimitProfile, identity?: string) {
  const config = profiles[profile];
  const ip = getClientIp(request);
  const key = `rate:${profile}:${identity || ip}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, config.windowSeconds);
  }

  const retryAfter = count > config.limit ? Math.max(await redis.ttl(key), 1) : 0;
  return {
    allowed: count <= config.limit,
    limit: config.limit,
    retryAfter,
  };
}

export function rateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { error: `Too many requests. Please try again in ${Math.ceil(retryAfter / 60)} minute(s).` },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || request.headers.get('x-real-ip') || 'local';
}
