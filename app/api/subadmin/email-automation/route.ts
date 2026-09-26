import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { ensureMonitoringTables } from '@/lib/monitoring';

const automations = [
  {
    id: 'LOGIN_OTP',
    name: 'Login OTP',
    trigger: 'Superadmin, subadmin, or alumni enters valid email and password.',
    recipient: 'The user trying to login',
    category: 'Security',
    protected: true,
  },
  {
    id: 'ALUMNI_CREDENTIALS',
    name: 'Alumni Account Credentials',
    trigger: 'Subadmin creates an alumni account from an eligible student.',
    recipient: 'New alumni email',
    category: 'Account Access',
    protected: true,
  },
  {
    id: 'EVENT',
    name: 'School Event Broadcast',
    trigger: 'Subadmin publishes a school event.',
    recipient: 'All registered alumni of this school',
    category: 'Broadcast',
    protected: false,
  },
  {
    id: 'UPDATE',
    name: 'Campus Update Broadcast',
    trigger: 'Subadmin or superadmin publishes a school update.',
    recipient: 'All registered alumni of this school',
    category: 'Broadcast',
    protected: false,
  },
  {
    id: 'LOGIN_LINK',
    name: 'Alumni Login Link',
    trigger: 'Alumni checks registered email and requests access.',
    recipient: 'Registered alumni email',
    category: 'Access Help',
    protected: false,
  },
  {
    id: 'PASSWORD_RESET_INSTRUCTION',
    name: 'Password Reset Instruction',
    trigger: 'Alumni requests password reset help.',
    recipient: 'Registered alumni email',
    category: 'Access Help',
    protected: false,
  },
  {
    id: 'ALUMNI_PASSWORD_RESET_OTP',
    name: 'Alumni Password Reset OTP',
    trigger: 'Alumni starts the forgot password flow.',
    recipient: 'Registered alumni email',
    category: 'Access Help',
    protected: true,
  },
  {
    id: 'ALUMNI_ACCESS_RESET',
    name: 'Subadmin Reset Access',
    trigger: 'Subadmin clicks Reset Access from alumni directory.',
    recipient: 'Selected alumni email',
    category: 'Account Support',
    protected: true,
  },
  {
    id: 'OTP',
    name: 'Donation Alumni OTP',
    trigger: 'Alumni verifies email before donation.',
    recipient: 'Registered alumni email',
    category: 'Donation Security',
    protected: true,
  },
  {
    id: 'DONATION_PAYMENT_LINK',
    name: 'Donation Payment Link',
    trigger: 'Donor starts a donation inquiry.',
    recipient: 'Donor email',
    category: 'Donation',
    protected: true,
  },
  {
    id: 'DONATION_RECEIPT',
    name: 'Donation Receipt',
    trigger: 'Donation payment is verified.',
    recipient: 'Donor email',
    category: 'Donation',
    protected: true,
  },
];

export async function GET() {
  try {
    const session = await getSessionFromCookies('SUB_ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await ensureMonitoringTables();

    const result = await pool.query(
      `
        SELECT
          "emailType",
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE status = 'SENT')::int as sent,
          COUNT(*) FILTER (WHERE status = 'FAILED')::int as failed,
          COUNT(*) FILTER (WHERE status = 'SKIPPED')::int as skipped,
          MAX("createdAt") as "lastSentAt"
        FROM "EmailLog"
        WHERE "schoolId" = $1
        GROUP BY "emailType"
      `,
      [session.schoolId]
    );

    const summary = new Map(result.rows.map((row) => [row.emailType, row]));
    const rows = automations.map((automation) => {
      const stats = summary.get(automation.id) as any;
      return {
        ...automation,
        status: 'ACTIVE',
        total: stats?.total || 0,
        sent: stats?.sent || 0,
        failed: stats?.failed || 0,
        skipped: stats?.skipped || 0,
        lastSentAt: stats?.lastSentAt || null,
      };
    });

    return NextResponse.json({
      rows,
      totals: {
        active: rows.length,
        sent: rows.reduce((sum, row) => sum + row.sent, 0),
        failed: rows.reduce((sum, row) => sum + row.failed, 0),
        skipped: rows.reduce((sum, row) => sum + row.skipped, 0),
      },
    });
  } catch (error) {
    console.error('Email automation fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch email automation data' }, { status: 500 });
  }
}
