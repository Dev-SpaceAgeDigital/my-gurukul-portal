import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { uploadMedia } from '@/lib/storage';

export async function GET() {
  try {
    const session = await getSessionFromCookies('ALUMNI');
    if (!session || session.role !== 'ALUMNI') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await pool.query(
      `SELECT a.id, a.name, a.email, a."batchYear", a."linkedIn", a."profilePic", a."currentTitle", a."currentBio", a."workLink", a.industry, a.phone, a."countryCode", a.country, a.state, a.city, a."twoFactorEnabled", s."schoolName", s."logoUrl" as "schoolLogo", t."logoUrl" as "trustLogo"
       FROM "Alumni" a
       LEFT JOIN "School" s ON a."schoolId" = s.id
       LEFT JOIN "Trust" t ON s."trustId" = t.id
       WHERE a.id = $1`,
      [session.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const row = result.rows[0];
    const logoUrl = row.schoolLogo || row.trustLogo || '/madni-logo.png';

    return NextResponse.json({
      ...row,
      logoUrl,
      twoFactorEnabled: !!row.twoFactorEnabled
    });
  } catch (error: any) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionFromCookies('ALUMNI');
    if (!session || session.role !== 'ALUMNI') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const currentTitle = formData.get('currentTitle') as string;
    const currentBio = formData.get('currentBio') as string;
    const workLink = formData.get('workLink') as string;
    const linkedIn = formData.get('linkedIn') as string;
    const industry = formData.get('industry') as string;
    const phone = formData.get('phone') as string;
    const countryCode = formData.get('countryCode') as string;
    const country = formData.get('country') as string;
    const state = formData.get('state') as string;
    const city = formData.get('city') as string;
    const profilePicFile = formData.get('profilePic') as File | null;

    let profilePicUrl = formData.get('existingProfilePic') as string || null;

    if (profilePicFile && profilePicFile.size > 0) {
      const bytes = await profilePicFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${session.userId}_${Date.now()}`;
      
      const uploadRes: any = await uploadMedia(buffer, fileName, 'alumni-profiles', true);
      profilePicUrl = uploadRes.secure_url;
    }

    const updateQuery = `
      UPDATE "Alumni"
      SET 
        name = COALESCE($1, name),
        "currentTitle" = $2,
        "currentBio" = $3,
        "workLink" = $4,
        "linkedIn" = $5,
        "profilePic" = $6,
        industry = $7,
        country = $8,
        state = $9,
        city = $10,
        phone = COALESCE($11, phone),
        "countryCode" = COALESCE($12, "countryCode"),
        "updatedAt" = NOW()
      WHERE id = $13
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      name, currentTitle, currentBio, workLink, linkedIn, profilePicUrl, industry, country, state, city, phone || null, countryCode || null, session.userId
    ]);

    return NextResponse.json(result.rows[0]);

  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
