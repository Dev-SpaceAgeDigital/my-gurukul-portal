import { NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse, type RateLimitProfile } from '@/lib/security/rateLimit';
import { getSessionFromCookies, type AuthSession, type UserRole } from '@/lib/auth';

type ApiSecurityOptions = {
  role?: UserRole | 'ADMIN';
  rateLimit?: RateLimitProfile | ((request: Request) => RateLimitProfile);
};

type SecureContext = {
  session: AuthSession | null;
};

export function withApiSecurity(
  handler: (request: Request, context: SecureContext) => Promise<Response>,
  options: ApiSecurityOptions = {}
) {
  return async function securedHandler(request: Request) {
    if (options.rateLimit) {
      const profile = typeof options.rateLimit === 'function' ? options.rateLimit(request) : options.rateLimit;
      const limit = await checkRateLimit(request, profile);
      if (!limit.allowed) return rateLimitResponse(limit.retryAfter);
    }

    let session: AuthSession | null = null;
    if (options.role) {
      session = await getSessionFromCookies(options.role);
      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (options.role !== 'ADMIN' && session.role !== options.role) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return handler(request, { session });
  };
}

export function methodRateLimit(request: Request): RateLimitProfile {
  if (request.method === 'GET') return 'authRead';
  return 'mutation';
}

export function publicMethodRateLimit(request: Request): RateLimitProfile {
  if (request.method === 'GET') return 'publicRead';
  return 'publicForm';
}
