import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createAlumniToken, encryptSession, setSessionCookie, type UserRole } from '@/lib/auth';
import { normalizeLoginEmail, verifyLoginOtp } from '@/lib/auth/loginOtp';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

const redirectMap: Record<UserRole, string> = {
  SUPER_ADMIN: '/superadmin/dashboard',
  SUB_ADMIN: '/subadmin/dashboard',
  ALUMNI: '/alumni/dashboard',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const role = body.role as UserRole;
    const email = normalizeLoginEmail(body.email);
    const otp = String(body.otp || '').trim();

    if (!['SUPER_ADMIN', 'SUB_ADMIN', 'ALUMNI'].includes(role) || !email || !otp) {
      return NextResponse.json({ error: 'Role, email and OTP are required' }, { status: 400 });
    }

    const limit = await checkRateLimit(request, 'otp', `${role}:${email}`);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    const verified = await verifyLoginOtp(role, email, otp);
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: 401 });
    }

    if (role === 'ALUMNI') {
      const result = await query('SELECT id, email, "schoolId" FROM "Alumni" WHERE LOWER(email) = $1', [email]);
      const alumni = result.rows[0];
      if (!alumni) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

      const token = await createAlumniToken({
        userId: alumni.id,
        role: 'ALUMNI',
        email: alumni.email,
        schoolId: alumni.schoolId,
      });
      await setSessionCookie(token, 'ALUMNI');
    } else {
      const result = await query('SELECT id, email, role, "schoolId" FROM "User" WHERE LOWER(email) = $1 AND role = $2', [email, role]);
      const user = result.rows[0];
      if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

      const token = await encryptSession({
        userId: user.id,
        role,
        email: user.email,
        schoolId: user.schoolId,
      });
      await setSessionCookie(token, role);
    }

    return NextResponse.json({ success: true, redirectTo: redirectMap[role] });
  } catch (error) {
    console.error('Login OTP verify error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
