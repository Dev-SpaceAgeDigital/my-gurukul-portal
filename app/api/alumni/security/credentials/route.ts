import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies, hashPassword, comparePassword } from '@/lib/auth';
import { verifyTotpToken } from '@/lib/auth/totp2fa';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/monitoring';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('ALUMNI');
    if (!session || session.role !== 'ALUMNI') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { changeType, email, phone, countryCode, currentPassword, newPassword, totpCode } = body;

    if (!changeType || !totpCode) {
      return NextResponse.json({ error: 'Change type and 6-digit 2FA code are required.' }, { status: 400 });
    }

    // 1. Fetch current alumni record including 2FA secret and password
    const alumniRes = await pool.query(
      `SELECT id, name, email, phone, "countryCode", "schoolId", "batchYear", password, "twoFactorEnabled", "twoFactorSecret"
       FROM "Alumni"
       WHERE id = $1`,
      [session.userId]
    );

    if (alumniRes.rows.length === 0) {
      return NextResponse.json({ error: 'Alumni record not found.' }, { status: 404 });
    }

    const alumni = alumniRes.rows[0];

    // 2. Enforce 2FA is active
    if (!alumni.twoFactorEnabled || !alumni.twoFactorSecret) {
      return NextResponse.json(
        { error: 'Two-Factor Authentication (2FA) must be enabled on your account before modifying sensitive credentials.' },
        { status: 403 }
      );
    }

    // 3. Verify TOTP 6-digit token
    const isTotpValid = verifyTotpToken(alumni.twoFactorSecret, totpCode);
    if (!isTotpValid) {
      return NextResponse.json(
        { error: 'Invalid or expired 6-digit Authenticator code. Please check your app and try again.' },
        { status: 400 }
      );
    }

    let auditField = '';
    let notificationDetail = '';
    let updateQuery = '';
    let updateParams: any[] = [];

    // 4. Process Specific Credential Change
    if (changeType === 'EMAIL') {
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
      }

      if (cleanEmail === alumni.email.toLowerCase()) {
        return NextResponse.json({ error: 'New email must be different from current email.' }, { status: 400 });
      }

      // Check unique constraint in Alumni and User tables
      const duplicateAlumni = await pool.query('SELECT id FROM "Alumni" WHERE LOWER(email) = $1 AND id != $2', [cleanEmail, alumni.id]);
      const duplicateUser = await pool.query('SELECT id FROM "User" WHERE LOWER(email) = $1', [cleanEmail]);

      if (duplicateAlumni.rows.length > 0 || duplicateUser.rows.length > 0) {
        return NextResponse.json({ error: 'This email address is already associated with another account.' }, { status: 400 });
      }

      updateQuery = `UPDATE "Alumni" SET email = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING email`;
      updateParams = [cleanEmail, alumni.id];
      auditField = 'EMAIL';
      notificationDetail = `Email updated from ${alumni.email} to ${cleanEmail}`;

    } else if (changeType === 'PHONE') {
      const cleanPhone = String(phone || '').trim();
      const cleanCode = String(countryCode || alumni.countryCode || '+91').trim();

      if (!cleanPhone || cleanPhone.length < 5) {
        return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
      }

      updateQuery = `UPDATE "Alumni" SET phone = $1, "countryCode" = $2, "updatedAt" = NOW() WHERE id = $3 RETURNING phone, "countryCode"`;
      updateParams = [cleanPhone, cleanCode, alumni.id];
      auditField = 'PHONE_NUMBER';
      notificationDetail = `Phone number updated to ${cleanCode} ${cleanPhone}`;

    } else if (changeType === 'PASSWORD') {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
      }

      // If existing password exists, verify current password
      if (alumni.password) {
        if (!currentPassword) {
          return NextResponse.json({ error: 'Current password is required to change password.' }, { status: 400 });
        }
        const isCurrentMatch = await comparePassword(currentPassword, alumni.password);
        if (!isCurrentMatch) {
          return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
        }
      }

      const hashedPassword = await hashPassword(newPassword);
      updateQuery = `UPDATE "Alumni" SET password = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING id`;
      updateParams = [hashedPassword, alumni.id];
      auditField = 'PASSWORD';
      notificationDetail = `Account password successfully reset with 2FA step-up authorization.`;

    } else {
      return NextResponse.json({ error: 'Invalid changeType specified.' }, { status: 400 });
    }

    // 5. Execute DB Update
    const updateResult = await pool.query(updateQuery, updateParams);

    // 6. Real-Time Bell Notification to School Sub-Admin & Super-Admin
    try {
      await createNotification({
        title: '🔐 Alumni Security Credential Modified',
        message: `Alumnus ${alumni.name} (Batch ${alumni.batchYear || 'Alumni'}) updated their ${auditField}. ${notificationDetail}`,
        type: 'MONITORING',
        priority: 'HIGH',
        actorRole: 'ALUMNI',
        actorId: alumni.id,
        schoolId: alumni.schoolId,
        entityType: 'ALUMNI_SECURITY',
        entityId: alumni.id,
        link: `/alumni/directory`,
        audiences: [
          ...(alumni.schoolId
            ? [{ type: 'SCHOOL_ROLE' as const, recipientRole: 'SUB_ADMIN' as const, schoolId: alumni.schoolId }]
            : []),
          { type: 'ROLE' as const, recipientRole: 'SUPER_ADMIN' as const },
        ],
      });
    } catch (notifErr) {
      console.error('Failed to dispatch security notification:', notifErr);
    }

    // 7. Record Live Monitoring Activity Log
    try {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || 'Unknown';

      await logActivity({
        schoolId: alumni.schoolId,
        actorRole: 'ALUMNI',
        actorId: alumni.id,
        actorName: alumni.name,
        actorEmail: alumni.email,
        category: 'SECURITY',
        action: `CREDENTIAL_UPDATE_${auditField}`,
        title: `Alumni Security Credential Changed: ${auditField}`,
        message: `${alumni.name} updated ${auditField} with step-up 2FA authorization.`,
        status: 'SUCCESS',
        entityType: 'ALUMNI',
        entityId: alumni.id,
        metadata: {
          auditField,
          notificationDetail,
          ip,
          userAgent,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logErr) {
      console.error('Failed to log security activity:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: `${auditField.replace('_', ' ')} updated successfully with 2FA verification.`,
      data: updateResult.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating alumni security credentials:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update credentials' }, { status: 500 });
  }
}
