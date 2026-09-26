import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getSessionFromCookies } from '@/lib/auth';
import pool from '@/lib/db';

export async function generateMetadata(): Promise<Metadata> {
  try {
    // Try to get the alumni's school name from their session
    const session = await getSessionFromCookies('ALUMNI');

    if (session?.schoolId) {
      const res = await pool.query(
        `SELECT s."schoolName", t."trustName"
         FROM "School" s
         LEFT JOIN "Trust" t ON s."trustId" = t.id
         WHERE s.id = $1`,
        [session.schoolId]
      );
      const row = res.rows[0];
      if (row?.schoolName) {
        return {
          title: {
            default: `${row.schoolName} - Alumni Hub`,
            template: `%s | ${row.schoolName} Alumni`,
          },
          description: `Alumni Engagement & Achievement Portal — ${row.schoolName}`,
        };
      }
    }
  } catch {
    // Fall through to generic default
  }

  // Generic SaaS fallback (shown in dev / before login)
  return {
    title: {
      default: 'Alumni Hub | My Gurukul',
      template: '%s | My Gurukul Alumni',
    },
    description: 'Alumni Engagement & Achievement Portal',
  };
}

export default function AlumniLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="alumni-portal h-full">{children}</div>;
}
