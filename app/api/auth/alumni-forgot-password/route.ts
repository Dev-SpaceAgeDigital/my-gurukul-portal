import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendAlumniPasswordResetOtp, normalizeResetEmail } from '@/lib/auth/passwordReset';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export async function POST(request: Request) {
  try {
    const limit = await checkRateLimit(request, 'otp');
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    const { email } = await request.json();
    const cleanInput = normalizeResetEmail(email);
    const cleanDigits = String(email || '').replace(/\D/g, '');

    if (!cleanInput) return NextResponse.json({ error: 'Email or phone number is required' }, { status: 400 });

    const result = await query(
      `SELECT id, name, email, phone, "schoolId" 
       FROM "Alumni" 
       WHERE LOWER(email) = $1 
          OR phone = $1 
          OR ($2 != '' AND REPLACE(REPLACE(phone, ' ', ''), '-', '') = $2)
          OR (LENGTH($2) >= 10 AND phone LIKE '%' || $2)
       LIMIT 1`,
      [cleanInput, cleanDigits]
    );
    const alumni = result.rows[0];

    if (!alumni) {
      return NextResponse.json({ error: 'No alumni account found for this email or phone number.' }, { status: 404 });
    }

    if (!alumni.email || !alumni.email.includes('@')) {
      return NextResponse.json({
        error: 'No email address is linked to this account. Please contact your School Administrator to reset your temporary password.',
      }, { status: 400 });
    }

    await sendAlumniPasswordResetOtp({
      alumniId: alumni.id,
      schoolId: alumni.schoolId,
      email: alumni.email,
      name: alumni.name,
    });

    return NextResponse.json({
      success: true,
      email: alumni.email,
      message: `Password reset OTP has been sent to your registered email (${alumni.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}).`,
    });
  } catch (error) {
    console.error('Alumni forgot password error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to send reset OTP' }, { status: 500 });
  }
}
