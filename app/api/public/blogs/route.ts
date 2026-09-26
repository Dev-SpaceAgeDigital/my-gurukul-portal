import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        b.id,
        b.title,
        b.content,
        b.tags,
        b."mediaUrl",
        b."mediaType",
        b.status,
        b."isFeatured",
        b."isTopFeatured",
        b."createdAt",
        COALESCE(s."schoolName", 'Madni Education Trust') AS "schoolName",
        COALESCE(a.name, 'Madni Education Trust') AS "authorName",
        COALESCE(a."currentTitle", 'Trust Writer') AS "authorRole",
        a."profilePic" AS "authorAvatar"
      FROM "Blog" b
      LEFT JOIN "School" s ON b."schoolId" = s.id
      LEFT JOIN "Alumni" a ON b."alumniId" = a.id
      WHERE b.status = 'APPROVED'
      ORDER BY b."isTopFeatured" DESC, b."isFeatured" DESC, b."createdAt" DESC
    `);

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    return NextResponse.json({ success: true, blogs: result.rows }, { headers });
  } catch (error: any) {
    console.error('Error fetching public blogs:', error);
    return NextResponse.json({ error: 'Failed to fetch public blogs' }, { status: 500 });
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
