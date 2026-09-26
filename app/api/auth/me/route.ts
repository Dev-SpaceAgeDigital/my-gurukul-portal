import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    // 1. Check Admin Session (Super or Sub)
    let session = await getSessionFromCookies('ADMIN');
    let userData: any = null;

    if (session) {
      // For Sub-Admin, get school details & school logo
      let schoolName = null;
      let trustName = null;
      let schoolLogoUrl = null;
      let trustLogoUrl = null;

      if (session.role === 'SUB_ADMIN' && session.schoolId) {
        const schoolRes = await pool.query(`
          SELECT s."schoolName", t."trustName", s."logoUrl" as "schoolLogo", t."logoUrl" as "trustLogo"
          FROM "School" s
          LEFT JOIN "Trust" t ON s."trustId" = t.id
          WHERE s.id = $1
        `, [session.schoolId]);
        if (schoolRes.rows.length > 0) {
          schoolName = schoolRes.rows[0].schoolName;
          trustName = schoolRes.rows[0].trustName;
          schoolLogoUrl = schoolRes.rows[0].schoolLogo;
          trustLogoUrl = schoolRes.rows[0].trustLogo;
        }
      } else if (session.role === 'SUPER_ADMIN') {
        if (session.schoolId) {
          const trustRes = await pool.query(`
            SELECT t."trustName", t."logoUrl" as "trustLogo"
            FROM "School" s
            LEFT JOIN "Trust" t ON s."trustId" = t.id
            WHERE s.id = $1
          `, [session.schoolId]);
          if (trustRes.rows.length > 0) {
            trustName = trustRes.rows[0].trustName;
            trustLogoUrl = trustRes.rows[0].trustLogo;
          }
        }
        if (!trustName) {
          const trustRes = await pool.query('SELECT "trustName", "logoUrl" FROM "Trust" LIMIT 1');
          trustName = trustRes.rows[0]?.trustName || null;
          trustLogoUrl = trustRes.rows[0]?.logoUrl || null;
        }
      }

      // Fetch user name & 2FA status from User table
      const userRes = await pool.query('SELECT name, "twoFactorEnabled" FROM "User" WHERE id = $1', [session.userId]);
      const name = userRes.rows[0]?.name || 'Administrator';
      const twoFactorEnabled = !!userRes.rows[0]?.twoFactorEnabled;

      const logoUrl = schoolLogoUrl || trustLogoUrl || '/my-gurukul.png';

      userData = {
        id: session.userId,
        name,
        email: session.email,
        role: session.role,
        schoolName,
        trustName,
        logoUrl,
        twoFactorEnabled
      };
    } else {
      // 2. Check Alumni Session
      session = await getSessionFromCookies('ALUMNI');
      if (session) {
        // Fetch alumni details from Alumni table
        const alumniRes = await pool.query(`
          SELECT a.name, a."batchYear", a."profilePic", a."currentTitle", s."schoolName", s."logoUrl" as "schoolLogo", t."logoUrl" as "trustLogo"
          FROM "Alumni" a
          LEFT JOIN "School" s ON a."schoolId" = s.id
          LEFT JOIN "Trust" t ON s."trustId" = t.id
          WHERE a.id = $1
        `, [session.userId]);
        const alumniData = alumniRes.rows[0] || {};
        const logoUrl = alumniData.schoolLogo || alumniData.trustLogo || '/my-gurukul.png';

        userData = {
          id: session.userId,
          name: alumniData.name || 'Alumni',
          email: session.email,
          role: 'ALUMNI',
          batchYear: alumniData.batchYear || null,
          profilePic: alumniData.profilePic || null,
          currentTitle: alumniData.currentTitle || null,
          schoolName: alumniData.schoolName || 'Madni Education Trust',
          logoUrl
        };
      }
    }

    if (!userData) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(userData);

  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
