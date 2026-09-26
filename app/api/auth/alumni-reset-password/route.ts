import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { clearAlumniPasswordResetOtp, normalizeResetEmail, verifyAlumniPasswordResetOtp } from '@/lib/auth/passwordReset';
import { logActivity } from '@/lib/monitoring';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export async function POST(request: Request) {
  try {
    const limit = await checkRateLimit(request, 'otp');
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    const { email, otp, newPassword } = await request.json();
    const cleanEmail = normalizeResetEmail(email);
    const password = String(newPassword || '');

    if (!cleanEmail || !otp || password.length < 8) {
      return NextResponse.json({ error: 'Email, OTP and minimum 8 character password are required' }, { status: 400 });
    }

    const verified = await verifyAlumniPasswordResetOtp(cleanEmail, otp);
    if (!verified.ok) return NextResponse.json({ error: verified.error }, { status: 401 });

    const alumniRes = await query('SELECT id, name, email, "schoolId" FROM "Alumni" WHERE LOWER(email) = $1', [cleanEmail]);
    const alumni = alumniRes.rows[0];
    if (!alumni || alumni.id !== verified.alumniId) {
      return NextResponse.json({ error: 'Invalid password reset session' }, { status: 401 });
    }

    const hashedPassword = await hashPassword(password);
    await query('UPDATE "Alumni" SET password = $1, "updatedAt" = NOW() WHERE id = $2', [hashedPassword, alumni.id]);
    await clearAlumniPasswordResetOtp(cleanEmail);

    await logActivity({
      schoolId: alumni.schoolId,
      actorRole: 'ALUMNI',
      actorId: alumni.id,
      actorName: alumni.name,
      actorEmail: alumni.email,
      category: 'PASSWORD_RESET',
      action: 'ALUMNI_PASSWORD_RESET_COMPLETED',
      title: 'Alumni password reset completed',
      message: 'An alumni reset their portal password.',
      status: 'SUCCESS',
      entityType: 'Alumni',
      entityId: alumni.id,
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully. Please login again.' });
  } catch (error) {
    console.error('Alumni reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
