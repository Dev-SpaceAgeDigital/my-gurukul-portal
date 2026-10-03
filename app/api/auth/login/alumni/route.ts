import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword, createAlumniToken, setSessionCookie } from '@/lib/auth';
import { startLoginOtp, normalizeLoginEmail, isDemoEmail } from '@/lib/auth/loginOtp';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export async function POST(request: Request) {
  try {
    const limit = await checkRateLimit(request, 'login');
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    const { email, password, rememberMe = true } = await request.json();
    const cleanInput = normalizeLoginEmail(email);
    const cleanDigits = String(email || '').replace(/\D/g, '');

    // Search by Email OR Phone number (with and without formatting)
    const result = await query(
      `SELECT * FROM "Alumni" 
       WHERE LOWER(email) = $1 
          OR phone = $1 
          OR ($2 != '' AND REPLACE(REPLACE(phone, ' ', ''), '-', '') = $2)
          OR (LENGTH($2) >= 10 AND phone LIKE '%' || $2)
       LIMIT 1`,
      [cleanInput, cleanDigits]
    );
    const alumni = result.rows[0];

    const isDemo = isDemoEmail(cleanInput);
    const passwordMatches = alumni
      ? (await comparePassword(password, alumni.password)) ||
        (isDemo && (password === '123456' || password === 'Demo@123456' || password.toLowerCase() === 'demoalumni123!'))
      : false;

    if (!alumni || !passwordMatches) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please check your phone/email and password.' },
        { status: 401 }
      );
    }

    // 2FA Verification if enabled
    if (alumni.twoFactorEnabled && alumni.twoFactorSecret) {
      return NextResponse.json({
        success: true,
        requires2FA: true,
        role: 'ALUMNI',
        email: alumni.email || alumni.phone,
        message: 'Two-Factor Authentication is enabled. Please enter your 6-digit Authenticator code or Backup Code.',
      });
    }

    // If alumni has NO email address, log them in directly with session token
    if (!alumni.email || !alumni.email.includes('@')) {
      const token = await createAlumniToken(
        {
          userId: alumni.id,
          role: 'ALUMNI',
          email: alumni.email || alumni.phone || 'alumni@platform',
          schoolId: alumni.schoolId,
          tokenVersion: alumni.tokenVersion || 1,
        },
        rememberMe
      );

      await setSessionCookie(token, 'ALUMNI', rememberMe);

      return NextResponse.json({
        success: true,
        redirectTo: '/alumni/dashboard',
        message: 'Signed in successfully.',
      });
    }

    // Standard Email OTP Login flow if email exists
    const otpRes = await startLoginOtp({
      role: 'ALUMNI',
      email: alumni.email,
      userId: alumni.id,
      schoolId: alumni.schoolId,
      name: alumni.name,
    });

    let message = 'OTP sent to your registered email.';
    if (isDemo) {
      message = 'OTP sent to your registered email. (Demo OTP: 123456)';
    } else if (otpRes?.fallbackOtp) {
      message = `No email gateway configured yet. Use temporary OTP: ${otpRes.fallbackOtp}`;
    }

    return NextResponse.json({
      success: true,
      requiresOtp: true,
      role: 'ALUMNI',
      email: alumni.email,
      message,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
