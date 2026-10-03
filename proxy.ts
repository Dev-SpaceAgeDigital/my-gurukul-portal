import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_SECRET_STR = process.env.SESSION_SECRET || 'default_super_secure_session_secret_32_characters_long_min';
const JWT_SECRET_STR = process.env.JWT_SECRET || 'default_super_secure_jwt_secret_32_characters_long_min';

const SESSION_SECRET = new TextEncoder().encode(SESSION_SECRET_STR);
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const superadminToken = request.cookies.get('superadmin-session')?.value;
  const subadminToken = request.cookies.get('subadmin-session')?.value;
  const alumniToken = request.cookies.get('alumni-token')?.value;

  // 1. Handle Root Path '/' (PWA App Launcher & Direct Visits)
  if (pathname === '/') {
    // If Alumni is logged in, redirect straight to Alumni Dashboard
    if (alumniToken) {
      try {
        const { payload } = await jwtVerify(alumniToken, JWT_SECRET);
        if (payload.role === 'ALUMNI') {
          return NextResponse.redirect(new URL('/alumni/dashboard', request.url));
        }
      } catch {}
    }

    // If SubAdmin is logged in, redirect straight to SubAdmin Dashboard
    if (subadminToken) {
      try {
        const { payload } = await jwtVerify(subadminToken, SESSION_SECRET);
        if (payload.role === 'SUB_ADMIN') {
          return NextResponse.redirect(new URL('/subadmin/dashboard', request.url));
        }
      } catch {}
    }

    // If SuperAdmin is logged in, redirect straight to SuperAdmin Dashboard
    if (superadminToken) {
      try {
        const { payload } = await jwtVerify(superadminToken, SESSION_SECRET);
        if (payload.role === 'SUPER_ADMIN') {
          return NextResponse.redirect(new URL('/superadmin/dashboard', request.url));
        }
      } catch {}
    }

    return NextResponse.next();
  }

  // 2. Redirect already-logged-in users visiting login pages
  if (pathname === '/alumni/login' && alumniToken) {
    try {
      const { payload } = await jwtVerify(alumniToken, JWT_SECRET);
      if (payload.role === 'ALUMNI') {
        return NextResponse.redirect(new URL('/alumni/dashboard', request.url));
      }
    } catch {}
  }

  if (pathname === '/subadmin/login' && subadminToken) {
    try {
      const { payload } = await jwtVerify(subadminToken, SESSION_SECRET);
      if (payload.role === 'SUB_ADMIN') {
        return NextResponse.redirect(new URL('/subadmin/dashboard', request.url));
      }
    } catch {}
  }

  if (pathname === '/superadmin/login' && superadminToken) {
    try {
      const { payload } = await jwtVerify(superadminToken, SESSION_SECRET);
      if (payload.role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/superadmin/dashboard', request.url));
      }
    } catch {}
  }

  // Define paths that require authentication
  const isSuperAdminPath = pathname.startsWith('/superadmin') && !pathname.includes('/login') && !pathname.includes('/register');
  const isSubAdminPath = pathname.startsWith('/subadmin') && !pathname.includes('/login') && !pathname.includes('/register');
  const isAlumniPath = pathname.startsWith('/alumni') && !pathname.includes('/login') && !pathname.includes('/register');

  // Skip for non-protected paths
  if (!isSuperAdminPath && !isSubAdminPath && !isAlumniPath) {
    return NextResponse.next();
  }

  // Handle Superadmin Protected Routes
  if (isSuperAdminPath) {
    if (!superadminToken) {
      return NextResponse.redirect(new URL('/superadmin/login', request.url));
    }
    try {
      const { payload } = await jwtVerify(superadminToken, SESSION_SECRET);
      if (payload.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/superadmin/login', request.url));
      }
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/superadmin/login', request.url));
    }
  }

  // Handle Subadmin Protected Routes
  if (isSubAdminPath) {
    if (!subadminToken) {
      return NextResponse.redirect(new URL('/subadmin/login', request.url));
    }
    try {
      const { payload } = await jwtVerify(subadminToken, SESSION_SECRET);
      if (payload.role !== 'SUB_ADMIN' || !payload.schoolId) {
        return NextResponse.redirect(new URL('/subadmin/login', request.url));
      }
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/subadmin/login', request.url));
    }
  }

  // Handle Alumni Protected Routes
  if (isAlumniPath) {
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
  matcher: [
    '/',
    '/superadmin/:path*',
    '/subadmin/:path*',
    '/alumni/:path*',
  ],
};
