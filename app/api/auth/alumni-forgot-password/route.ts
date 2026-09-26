import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendAlumniPasswordResetOtp, normalizeResetEmail } from '@/lib/auth/passwordReset';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export async function POST(request: Request) {
  try {
    const limit = await checkRateLimit(request, 'otp');
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    const { email } = await request.json();
    const cleanEmail = normalizeResetEmail(email);
    if (!cleanEmail) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const result = await query('SELECT id, name, email, "schoolId" FROM "Alumni" WHERE LOWER(email) = $1', [cleanEmail]);
    const alumni = result.rows[0];
    if (!alumni) {
      return NextResponse.json({ error: 'No alumni account found for this email' }, { status: 404 });
    }

    await sendAlumniPasswordResetOtp({
      alumniId: alumni.id,
      schoolId: alumni.schoolId,
      email: alumni.email,
      name: alumni.name,
    });

    return NextResponse.json({ success: true, email: alumni.email, message: 'Password reset OTP sent to your email.' });
  } catch (error) {
    console.error('Alumni forgot password error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to send reset OTP' }, { status: 500 });
  }
}
