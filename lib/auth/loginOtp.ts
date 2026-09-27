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
  const brandName = 'My Gurukul Platform';
  const subject = `${otp} is your ${brandName} login OTP`;

  await redis.set(otpKey, JSON.stringify({ otp, email, role: input.role }), { ex: OTP_TTL_SECONDS });
  await redis.del(attemptsKey);

  try {
    const result = await sendEmail({
      to: email,
      subject,
      html: buildLoginOtpEmail({ otp, role: input.role, name: input.name, brandName }),
      schoolId: input.schoolId || undefined,
    });

    await logEmail({
      schoolId: input.schoolId,
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
    const otpKey = getOtpKey(role, email);
    const attemptsKey = getAttemptsKey(role, email);
    await redis.del(otpKey);
    await redis.del(attemptsKey);
    return { ok: true };
  }

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
    if (isDemo) return { ok: true }; // Fallback for demo mode if redis key expired
    return { ok: false, error: 'OTP expired. Please login again.' };
  }

  try {
    const parsed = JSON.parse(stored);
    if (parsed.otp !== otp && !(isDemo && otp === DEMO_OTP)) return { ok: false, error: 'Invalid OTP.' };
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

function buildLoginOtpEmail({ otp, role, name, brandName }: { otp: string; role: UserRole; name?: string | null; brandName?: string }) {
  const portalName = role === 'SUPER_ADMIN' ? 'Superadmin Portal' : role === 'SUB_ADMIN' ? 'Subadmin Portal' : 'Alumni Portal';
  const headerText = (brandName || 'My Gurukul Platform').toUpperCase();
  return `
    <div style="font-family: Arial, sans-serif; background: #f4f7f6; padding: 28px;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #dbe7e4; border-radius: 16px; overflow: hidden;">
        <div style="background: #1A6B5A; color: #ffffff; padding: 24px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">${escapeHtml(headerText)}</h2>
          <p style="margin: 6px 0 0; color: #c5e8df; font-size: 13px;">${portalName} secure login</p>
        </div>
        <div style="padding: 28px; color: #1f2937;">
          <p style="margin: 0 0 14px; font-size: 15px;">Greetings${name ? `, <strong>${escapeHtml(name)}</strong>` : ''}.</p>
          <p style="margin: 0 0 18px; color: #4b5563; font-size: 14px; line-height: 1.6;">Use this one-time password to complete your login. It expires in 5 minutes.</p>
          <div style="font-size: 34px; letter-spacing: 8px; font-weight: 800; color: #1A6B5A; background: #EAF4F0; border-radius: 12px; padding: 18px; text-align: center;">${otp}</div>
          <p style="margin: 18px 0 0; color: #718096; font-size: 12px;">If you did not request this login, please ignore this email.</p>
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
