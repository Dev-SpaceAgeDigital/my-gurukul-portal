import crypto from 'crypto';
import { redis } from '@/lib/redis';
import { logActivity, logEmail } from '@/lib/monitoring';
import { sendEmail } from '@/lib/emailSender';

const RESET_TTL_SECONDS = 10 * 60;
const RESET_ATTEMPT_LIMIT = 5;

type AlumniResetInput = {
  alumniId: string;
  schoolId?: string | null;
  email: string;
  name?: string | null;
};

export function normalizeResetEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

export async function sendAlumniPasswordResetOtp(input: AlumniResetInput) {
  const email = normalizeResetEmail(input.email);
  const otp = String(crypto.randomInt(100000, 999999));
  const subject = `${otp} is your Madni Alumni password reset OTP`;

  await redis.set(getResetKey(email), JSON.stringify({ otp, alumniId: input.alumniId }), { ex: RESET_TTL_SECONDS });
  await redis.del(getResetAttemptsKey(email));

  const result = await sendEmail({
    to: email,
    subject,
    html: buildResetOtpEmail({ otp, name: input.name }),
  });

  await logEmail({
    schoolId: input.schoolId,
    alumniId: input.alumniId,
    recipientEmail: email,
    recipientRole: 'ALUMNI',
    sourceRole: 'SYSTEM',
    emailType: 'ALUMNI_PASSWORD_RESET_OTP',
    subject,
    status: result.ok ? 'SENT' : result.provider === 'NONE' ? 'SKIPPED' : 'FAILED',
    provider: result.provider,
    providerMessageId: result.messageId || null,
    relatedEntityType: 'Alumni',
    relatedEntityId: input.alumniId,
    errorMessage: result.ok ? null : result.error || 'Failed to send password reset OTP',
  });

  await logActivity({
    schoolId: input.schoolId,
    actorRole: 'ALUMNI',
    actorId: input.alumniId,
    actorName: input.name,
    actorEmail: email,
    category: 'PASSWORD_RESET',
    action: 'ALUMNI_PASSWORD_RESET_OTP_REQUESTED',
    title: 'Alumni password reset OTP requested',
    message: 'An alumni requested a password reset OTP.',
    status: result.ok ? 'SENT' : 'FAILED',
    entityType: 'Alumni',
    entityId: input.alumniId,
  });

  if (!result.ok) {
    await redis.del(getResetKey(email));
    throw new Error(result.error || 'Failed to send password reset OTP.');
  }
}

export async function verifyAlumniPasswordResetOtp(emailInput: string, otpInput: string) {
  const email = normalizeResetEmail(emailInput);
  const attempts = await redis.incr(getResetAttemptsKey(email));
  if (attempts === 1) await redis.expire(getResetAttemptsKey(email), RESET_TTL_SECONDS);

  if (attempts > RESET_ATTEMPT_LIMIT) {
    return { ok: false, error: 'Too many wrong OTP attempts. Please request a new OTP.' };
  }

  const stored = await redis.get(getResetKey(email));
  if (!stored) return { ok: false, error: 'OTP expired. Please request a new OTP.' };

  try {
    const parsed = JSON.parse(stored);
    if (parsed.otp !== String(otpInput || '').trim()) {
      return { ok: false, error: 'Invalid OTP.' };
    }
    return { ok: true, alumniId: parsed.alumniId as string };
  } catch {
    return { ok: false, error: 'Invalid OTP session.' };
  }
}

export async function clearAlumniPasswordResetOtp(emailInput: string) {
  const email = normalizeResetEmail(emailInput);
  await redis.del(getResetKey(email));
  await redis.del(getResetAttemptsKey(email));
}

function getResetKey(email: string) {
  return `alumni-reset-otp:${email}`;
}

function getResetAttemptsKey(email: string) {
  return `alumni-reset-attempts:${email}`;
}

function buildResetOtpEmail({ otp, name }: { otp: string; name?: string | null }) {
  return `
    <div style="font-family: Arial, sans-serif; background: #f4f7f6; padding: 28px;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #dbe7e4; border-radius: 16px; overflow: hidden;">
        <div style="background: #1A6B5A; color: #ffffff; padding: 24px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">MADNI EDUCATION TRUST</h2>
          <p style="margin: 6px 0 0; color: #c5e8df; font-size: 13px;">Alumni password reset</p>
        </div>
        <div style="padding: 28px; color: #1f2937;">
          <p style="margin: 0 0 14px; font-size: 15px;">As-salamu alaykum${name ? `, <strong>${escapeHtml(name)}</strong>` : ''}.</p>
          <p style="margin: 0 0 18px; color: #4b5563; font-size: 14px; line-height: 1.6;">Use this OTP to reset your alumni portal password. It expires in 10 minutes.</p>
          <div style="font-size: 34px; letter-spacing: 8px; font-weight: 800; color: #1A6B5A; background: #EAF4F0; border-radius: 12px; padding: 18px; text-align: center;">${otp}</div>
          <p style="margin: 18px 0 0; color: #718096; font-size: 12px;">If you did not request this reset, please contact school administration.</p>
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
