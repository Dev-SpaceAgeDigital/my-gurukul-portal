import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        m.id,
        m.title,
        m.description,
        m."targetStudent",
        m.availability,
        m.category,
        m.status,
        m."createdAt",
        COALESCE(s."schoolName", 'All Schools') AS "schoolName",
        COALESCE(a.name, 'Sub-Admin / Alumni Mentor') AS "postedByName",
        a."currentTitle" AS "postedByTitle",
        a."batchYear" AS "postedByBatch",
        a."profilePic" AS "postedByAvatar"
      FROM "MentorshipOffer" m
      LEFT JOIN "School" s ON m."schoolId" = s.id
      LEFT JOIN "Alumni" a ON m."alumniId" = a.id
      WHERE m.status = 'APPROVED'
      ORDER BY m."createdAt" DESC
    `);

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    return NextResponse.json({ success: true, mentorships: result.rows }, { headers });
  } catch (error: any) {
    console.error('Error fetching public mentorships:', error);
    return NextResponse.json({ error: 'Failed to fetch public mentorships' }, { status: 500 });
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
