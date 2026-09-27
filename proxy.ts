import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_SECRET_STR = process.env.SESSION_SECRET || 'e9a4f6d8b3c1274950f28e6a1c5d4b8e9f3a7c2d1b0e5f4a6c8d9b2e1f3a5c7d';
const JWT_SECRET_STR = process.env.JWT_SECRET || 'c2b5e8a1d4f79c6b3e0a2d5f8c1b4e7a9d6f3b0c2e5a8d1f4b7c9e2a5d8f1c3b';

const SESSION_SECRET = new TextEncoder().encode(SESSION_SECRET_STR);
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR);


export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define paths that require authentication
  const isSuperAdminPath = pathname.startsWith('/superadmin') && !pathname.includes('/login') && !pathname.includes('/register');
  const isSubAdminPath = pathname.startsWith('/subadmin') && !pathname.includes('/login') && !pathname.includes('/register');
  const isAlumniPath = pathname.startsWith('/alumni') && !pathname.includes('/login') && !pathname.includes('/register');


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
