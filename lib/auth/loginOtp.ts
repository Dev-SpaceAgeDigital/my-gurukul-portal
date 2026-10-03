import crypto from 'crypto';
import { redis } from '@/lib/redis';
import { logEmail } from '@/lib/monitoring';
import type { UserRole } from '@/lib/auth';
import { sendEmail } from '@/lib/emailSender';

const OTP_TTL_SECONDS = 5 * 60;
const OTP_ATTEMPT_LIMIT = 5;

type LoginOtpInput = {
  role: UserRole;
  email: string;
  schoolId?: string | null;
  trustId?: string | null;
  userId?: string | null;
  name?: string | null;
};

export const DEMO_EMAILS = [
  'demo.superadmin@madni.org',
  'demo.subadmin@madni.org',
  'demo.alumni@madni.org',
];

export const DEMO_OTP = '123456';

export function isDemoEmail(email: string) {
  const clean = normalizeLoginEmail(email);
  return DEMO_EMAILS.includes(clean) || clean.startsWith('demo.');
}

export function normalizeLoginEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

export async function startLoginOtp(input: LoginOtpInput) {
  const email = normalizeLoginEmail(input.email);
  const isDemo = isDemoEmail(email);
  const otp = isDemo ? DEMO_OTP : String(crypto.randomInt(100000, 999999));
  const otpKey = getOtpKey(input.role, email);
  const attemptsKey = getAttemptsKey(input.role, email);

  // Dynamically resolve tenant trust & school branding
  let resolvedBrandName = 'Institutional Platform';
  let resolvedTrustName: string | undefined = undefined;
  let resolvedSchoolName: string | undefined = undefined;
  let resolvedLogoUrl: string | undefined = undefined;
  let resolvedPrimaryColor: string = '#1A6B5A';
  let effectiveSchoolId = input.schoolId || undefined;
  let effectiveTrustId = input.trustId || undefined;

  try {
    const { default: pool } = await import('@/lib/db');

    if (effectiveSchoolId) {
      const sRes = await pool.query(
        `SELECT s."schoolName", s."logoUrl" as "schoolLogo", t.id as "tId", t."trustName", t."logoUrl" as "trustLogo", t."primaryColor"
         FROM "School" s
         LEFT JOIN "Trust" t ON s."trustId" = t.id
         WHERE s.id = $1`,
        [effectiveSchoolId]
      );
      if (sRes.rows.length > 0) {
        const row = sRes.rows[0];
        resolvedSchoolName = row.schoolName;
        resolvedTrustName = row.trustName;
        resolvedLogoUrl = row.schoolLogo || row.trustLogo;
        resolvedPrimaryColor = row.primaryColor || '#1A6B5A';
        effectiveTrustId = effectiveTrustId || row.tId;
      }
    } else if (effectiveTrustId) {
      const tRes = await pool.query(
        `SELECT "trustName", "logoUrl", "primaryColor" FROM "Trust" WHERE id = $1`,
        [effectiveTrustId]
      );
      if (tRes.rows.length > 0) {
        const row = tRes.rows[0];
        resolvedTrustName = row.trustName;
        resolvedLogoUrl = row.logoUrl;
        resolvedPrimaryColor = row.primaryColor || '#1A6B5A';
      }
    } else if (input.userId) {
      // Look up User / Alumni entity directly
      if (input.role === 'ALUMNI') {
        const aRes = await pool.query(
          `SELECT a."schoolId", s."schoolName", s."logoUrl" as "schoolLogo", t.id as "trustId", t."trustName", t."logoUrl" as "trustLogo", t."primaryColor"
           FROM "Alumni" a
           LEFT JOIN "School" s ON a."schoolId" = s.id
           LEFT JOIN "Trust" t ON s."trustId" = t.id
           WHERE a.id = $1`,
          [input.userId]
        );
        if (aRes.rows.length > 0) {
          const row = aRes.rows[0];
          effectiveSchoolId = row.schoolId;
          effectiveTrustId = row.trustId;
          resolvedSchoolName = row.schoolName;
          resolvedTrustName = row.trustName;
          resolvedLogoUrl = row.schoolLogo || row.trustLogo;
          resolvedPrimaryColor = row.primaryColor || '#1A6B5A';
        }
      } else {
        const uRes = await pool.query(
          `SELECT u."schoolId", u."trustId", s."schoolName", s."logoUrl" as "schoolLogo", t."trustName", t."logoUrl" as "trustLogo", t."primaryColor"
           FROM "User" u
           LEFT JOIN "School" s ON u."schoolId" = s.id
           LEFT JOIN "Trust" t ON u."trustId" = t.id OR s."trustId" = t.id
           WHERE u.id = $1`,
          [input.userId]
        );
        if (uRes.rows.length > 0) {
          const row = uRes.rows[0];
          effectiveSchoolId = row.schoolId;
          effectiveTrustId = row.trustId;
          resolvedSchoolName = row.schoolName;
          resolvedTrustName = row.trustName;
          resolvedLogoUrl = row.schoolLogo || row.trustLogo;
          resolvedPrimaryColor = row.primaryColor || '#1A6B5A';
        }
      }
    }
  } catch (err) {
    console.error('[LoginOtp] Failed to query tenant details:', err);
  }

  if (input.role === 'SUPER_ADMIN') {
    resolvedBrandName = resolvedTrustName || 'Trust Governance';
  } else if (resolvedSchoolName && resolvedTrustName) {
    resolvedBrandName = `${resolvedSchoolName} | ${resolvedTrustName}`;
  } else {
    resolvedBrandName = resolvedSchoolName || resolvedTrustName || 'Institutional Portal';
  }

  const subject = `${otp} is your ${resolvedBrandName} login OTP`;

  // Persist to PostgreSQL Database for robust multi-process PM2 cluster reliability
  try {
    const { default: pool } = await import('@/lib/db');
    await pool.query(`
      INSERT INTO "LoginOtp" ("role", "email", "otp", "attempts", "expiresAt")
      VALUES ($1, $2, $3, 0, NOW() + INTERVAL '10 minutes')
      ON CONFLICT ("role", "email")
      DO UPDATE SET "otp" = $3, "attempts" = 0, "expiresAt" = NOW() + INTERVAL '10 minutes', "createdAt" = NOW()
    `, [input.role, email, otp]);
  } catch (dbErr) {
    console.warn('[LoginOtp] DB OTP store warning:', dbErr);
  }

  await redis.set(otpKey, JSON.stringify({ otp, email, role: input.role }), { ex: OTP_TTL_SECONDS });
  await redis.del(attemptsKey);

  try {
    const result = await sendEmail({
      to: email,
      subject,
      schoolName: resolvedSchoolName,
      trustName: resolvedTrustName,
      schoolId: effectiveSchoolId,
      trustId: effectiveTrustId,
      html: buildLoginOtpEmail({
        otp,
        role: input.role,
        name: input.name,
        brandName: resolvedBrandName,
        trustName: resolvedTrustName,
        schoolName: resolvedSchoolName,
        logoUrl: resolvedLogoUrl,
        primaryColor: resolvedPrimaryColor,
      }),
    });

    await logEmail({
      schoolId: effectiveSchoolId || null,
      alumniId: input.role === 'ALUMNI' ? input.userId : null,
      recipientEmail: email,
      recipientRole: input.role,
      sourceRole: 'SYSTEM',
      emailType: 'LOGIN_OTP',
      subject,
      status: result.ok ? 'SENT' : result.provider === 'NONE' ? 'SKIPPED' : 'FAILED',
      provider: result.provider,
      providerMessageId: result.messageId || null,
      relatedEntityType: input.role === 'ALUMNI' ? 'Alumni' : 'User',
      relatedEntityId: input.userId,
      errorMessage: result.ok ? null : result.error || 'Failed to send login OTP',
    });

    if (!result.ok && !isDemo) {
      if (result.provider === 'NONE') {
        return {
          ok: true,
          emailSent: false,
          fallbackOtp: otp,
          warning: 'No email service API key configured (neither Trust Brevo key nor server BREVO_API_KEY).',
        };
      }
      throw new Error(result.error || 'Failed to send login OTP.');
    }

    return {
      ok: true,
      emailSent: true,
    };
  } catch (error) {
    if (!isDemo) {
      await redis.del(otpKey);
      throw error;
    }
    return { ok: true, emailSent: false, fallbackOtp: DEMO_OTP };
  }
}

export async function verifyLoginOtp(role: UserRole, emailInput: string, otpInput: string) {
  const email = normalizeLoginEmail(emailInput);
  const otp = String(otpInput || '').trim();
  const isDemo = isDemoEmail(email);

  if (isDemo && otp === DEMO_OTP) {
    try {
      const { default: pool } = await import('@/lib/db');
      await pool.query('DELETE FROM "LoginOtp" WHERE "role" = $1 AND LOWER("email") = $2', [role, email]);
    } catch {}
    const otpKey = getOtpKey(role, email);
    const attemptsKey = getAttemptsKey(role, email);
    await redis.del(otpKey);
    await redis.del(attemptsKey);
    return { ok: true };
  }

  // 1. Check PostgreSQL Database First (shared across all PM2 cluster workers)
  try {
    const { default: pool } = await import('@/lib/db');
    const res = await pool.query(
      'SELECT "otp", "attempts", "expiresAt" FROM "LoginOtp" WHERE "role" = $1 AND LOWER("email") = $2',
      [role, email]
    );
    if (res.rows.length > 0) {
      const row = res.rows[0];
      const isExpired = new Date(row.expiresAt).getTime() < Date.now();
      if (isExpired) {
        await pool.query('DELETE FROM "LoginOtp" WHERE "role" = $1 AND LOWER("email") = $2', [role, email]);
        return { ok: false, error: 'OTP expired. Please request a new OTP.' };
      }
      if (row.attempts >= OTP_ATTEMPT_LIMIT) {
        return { ok: false, error: 'Too many wrong OTP attempts. Please request a new OTP.' };
      }

      if (row.otp === otp || (isDemo && otp === DEMO_OTP)) {
        await pool.query('DELETE FROM "LoginOtp" WHERE "role" = $1 AND LOWER("email") = $2', [role, email]);
        const otpKey = getOtpKey(role, email);
        const attemptsKey = getAttemptsKey(role, email);
        await redis.del(otpKey);
        await redis.del(attemptsKey);
        return { ok: true };
      } else {
        await pool.query('UPDATE "LoginOtp" SET "attempts" = "attempts" + 1 WHERE "role" = $1 AND LOWER("email") = $2', [role, email]);
        return { ok: false, error: 'Invalid OTP. Please check the code sent to your email.' };
      }
    }
  } catch (dbErr) {
    console.warn('[LoginOtp] DB verify fallback to Redis:', dbErr);
  }

  // 2. Fallback to Redis / In-Memory
  const otpKey = getOtpKey(role, email);
  const attemptsKey = getAttemptsKey(role, email);
  const attempts = await redis.incr(attemptsKey);

  if (attempts === 1) {
    await redis.expire(attemptsKey, OTP_TTL_SECONDS);
  }

  if (attempts > OTP_ATTEMPT_LIMIT) {
    return { ok: false, error: 'Too many wrong OTP attempts. Please request a new OTP.' };
  }

  const stored = await redis.get(otpKey);
  if (!stored) {
    if (isDemo) return { ok: true };
    return { ok: false, error: 'OTP expired or not found. Please request a new OTP.' };
  }

  try {
    const parsed = JSON.parse(stored);
    if (parsed.otp !== otp && !(isDemo && otp === DEMO_OTP)) return { ok: false, error: 'Invalid OTP. Please check the code sent to your email.' };
  } catch {
    if (!isDemo) return { ok: false, error: 'Invalid OTP session.' };
  }

  await redis.del(otpKey);
  await redis.del(attemptsKey);
  return { ok: true };
}

function getOtpKey(role: UserRole, email: string) {
  return `login-otp:${role}:${email}`;
}

function getAttemptsKey(role: UserRole, email: string) {
  return `login-otp-attempts:${role}:${email}`;
}

function buildLoginOtpEmail({
  otp,
  role,
  name,
  brandName,
  trustName,
  schoolName,
  logoUrl,
  primaryColor,
}: {
  otp: string;
  role: UserRole;
  name?: string | null;
  brandName: string;
  trustName?: string;
  schoolName?: string;
  logoUrl?: string;
  primaryColor?: string;
}) {
  const portalName =
    role === 'SUPER_ADMIN'
      ? `${trustName || 'Trust'} Governance Console`
      : role === 'SUB_ADMIN'
      ? `${schoolName || 'School'} Admin Portal`
      : `${schoolName || 'Alumni'} Network Portal`;

  const headerColor = primaryColor && primaryColor.startsWith('#') ? primaryColor : '#1A6B5A';
  const logoHtml = logoUrl && (logoUrl.startsWith('http') || logoUrl.startsWith('/'))
    ? `<div style="text-align: center; margin-bottom: 12px;"><img src="${escapeHtml(logoUrl.startsWith('http') ? logoUrl : 'https://portal.my-gurukul.org' + logoUrl)}" alt="${escapeHtml(brandName)}" style="max-height: 48px; max-width: 160px; object-fit: contain; background: #ffffff; padding: 4px; border-radius: 8px;" /></div>`
    : '';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; padding: 32px 16px;">
      <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background: ${headerColor}; color: #ffffff; padding: 26px 20px; text-align: center;">
          ${logoHtml}
          <h2 style="margin: 0; font-size: 19px; font-weight: 700; letter-spacing: 0.5px;">${escapeHtml(brandName.toUpperCase())}</h2>
          <p style="margin: 6px 0 0; color: rgba(255, 255, 255, 0.85); font-size: 13px;">${escapeHtml(portalName)} Secure Login</p>
        </div>
        <div style="padding: 30px 24px; color: #1e293b;">
          <p style="margin: 0 0 12px; font-size: 15px; color: #334155;">Greetings${name ? `, <strong>${escapeHtml(name)}</strong>` : ''}.</p>
          <p style="margin: 0 0 20px; color: #64748b; font-size: 14px; line-height: 1.5;">Use this one-time password to complete your login. It expires in <strong>5 minutes</strong>.</p>
          
          <div style="font-size: 36px; letter-spacing: 10px; font-weight: 800; color: ${headerColor}; background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 18px 12px; text-align: center; margin: 16px 0;">
            ${otp}
          </div>
          
          <p style="margin: 20px 0 0; color: #94a3b8; font-size: 12px; line-height: 1.4; text-align: center;">
            If you did not request this login, you can safely ignore this email.
          </p>
        </div>
        <div style="background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 12px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
          Secured by ${escapeHtml(trustName || brandName)} Identity & Access Management
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

