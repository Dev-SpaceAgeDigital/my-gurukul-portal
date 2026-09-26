import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ensureCareerTables } from '@/lib/ensureCareerTables';

export async function GET() {
  try {
    await ensureCareerTables();

    const result = await pool.query(`
      SELECT 
        c.*,
        COALESCE(s."schoolName", 'Madni Education Trust') AS "schoolName",
        COALESCE(a.name, 'Sub-Admin / School Trustee') AS "postedByName",
        a."currentTitle" AS "postedByTitle",
        a."batchYear" AS "postedByBatch",
        a."profilePic" AS "postedByAvatar",
        COALESCE(i_int.interested_count, 0)::int as "interestedCount",
        COALESCE(i_ref.referral_count, 0)::int as "referralCount"
      FROM "CareerOpportunity" c
      LEFT JOIN "School" s ON c."schoolId" = s.id
      LEFT JOIN "Alumni" a ON c."alumniId" = a.id
      LEFT JOIN (
        SELECT "careerId", COUNT(*)::int as interested_count
        FROM "CareerInterest"
        WHERE "interestType" = 'INTERESTED'
        GROUP BY "careerId"
      ) i_int ON c.id = i_int."careerId"
      LEFT JOIN (
        SELECT "careerId", COUNT(*)::int as referral_count
        FROM "CareerInterest"
        WHERE "interestType" = 'REFERRAL_CONTACT'
        GROUP BY "careerId"
      ) i_ref ON c.id = i_ref."careerId"
      WHERE c.status = 'APPROVED'
      ORDER BY c."createdAt" DESC
    `);

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    return NextResponse.json({ success: true, careers: result.rows }, { headers });
  } catch (error: any) {
    console.error('Error fetching public careers:', error);
    return NextResponse.json({ error: 'Failed to fetch public careers' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
