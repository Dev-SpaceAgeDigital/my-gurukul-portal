import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword } from '@/lib/auth';
import { startLoginOtp, normalizeLoginEmail, isDemoEmail } from '@/lib/auth/loginOtp';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export async function POST(request: Request) {
  try {
    const limit = await checkRateLimit(request, 'login');
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    const { email, password } = await request.json();
    const cleanEmail = normalizeLoginEmail(email);

    const result = await query('SELECT * FROM "Alumni" WHERE LOWER(email) = $1', [cleanEmail]);
    const alumni = result.rows[0];

    const isDemo = isDemoEmail(cleanEmail);
    const passwordMatches = alumni ? ((await comparePassword(password, alumni.password)) || (isDemo && (password === '123456' || password === 'Demo@123456' || password.toLowerCase() === 'demoalumni123!'))) : false;

    if (!alumni || !passwordMatches) {
      return NextResponse.json({ error: 'Invalid credentials. For demo alumni account, use password: DemoAlumni123! or 123456' }, { status: 401 });
    }

    if (alumni.twoFactorEnabled && alumni.twoFactorSecret) {
      return NextResponse.json({
        success: true,
        requires2FA: true,
        role: 'ALUMNI',
        email: alumni.email,
        message: 'Two-Factor Authentication is enabled. Please enter your 6-digit Authenticator code or Backup Code.',
      });
    }

    await startLoginOtp({
      role: 'ALUMNI',
      email: alumni.email,
      userId: alumni.id,
      schoolId: alumni.schoolId,
      name: alumni.name,
    });

    return NextResponse.json({
      success: true,
      requiresOtp: true,
      role: 'ALUMNI',
      email: alumni.email,
      message: isDemo
        ? 'OTP sent to your registered email. (Demo OTP: 123456)'
        : 'OTP sent to your registered email.',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
