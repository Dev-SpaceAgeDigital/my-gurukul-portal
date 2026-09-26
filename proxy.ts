import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_SECRET_STR = process.env.SESSION_SECRET;
const JWT_SECRET_STR = process.env.JWT_SECRET;

if (!SESSION_SECRET_STR || SESSION_SECRET_STR.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long');
}
if (!JWT_SECRET_STR || JWT_SECRET_STR.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
}

const SESSION_SECRET = new TextEncoder().encode(SESSION_SECRET_STR);
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define paths that require authentication
  const isSuperAdminPath = pathname.startsWith('/superadmin') && !pathname.includes('/login');
  const isSubAdminPath = pathname.startsWith('/subadmin') && !pathname.includes('/login');
  const isAlumniPath = pathname.startsWith('/alumni') && !pathname.includes('/login');

  // Skip middleware/proxy for non-protected paths
  if (!isSuperAdminPath && !isSubAdminPath && !isAlumniPath) {
    return NextResponse.next();
  }

  // Handle Superadmin
  if (isSuperAdminPath) {
    const sessionToken = request.cookies.get('superadmin-session')?.value;
    if (!sessionToken) {
        return NextResponse.redirect(new URL('/superadmin/login', request.url));
    }
    try {
      const { payload } = await jwtVerify(sessionToken, SESSION_SECRET);
      if (payload.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/superadmin/login', request.url));
      }
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/superadmin/login', request.url));
    }
  }

  // Handle Subadmin
  if (isSubAdminPath) {
    const sessionToken = request.cookies.get('subadmin-session')?.value;
    if (!sessionToken) {
        return NextResponse.redirect(new URL('/subadmin/login', request.url));
    }
    try {
      const { payload } = await jwtVerify(sessionToken, SESSION_SECRET);
      if (payload.role !== 'SUB_ADMIN' || !payload.schoolId) {
        return NextResponse.redirect(new URL('/subadmin/login', request.url));
      }
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/subadmin/login', request.url));
    }
  }

  // Handle Alumni (JWT-based)
  if (isAlumniPath) {
    const alumniToken = request.cookies.get('alumni-token')?.value;

    if (!alumniToken) {
      return NextResponse.redirect(new URL('/alumni/login', request.url));
    }

    try {
      const { payload } = await jwtVerify(alumniToken, JWT_SECRET);
      if (payload.role !== 'ALUMNI') {
        return NextResponse.redirect(new URL('/alumni/login', request.url));
      }
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/alumni/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/superadmin/:path*', '/subadmin/:path*', '/alumni/:path*'],
};
