import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ensureAlumniFeaturedColumn } from '@/lib/ensureAlumniFeaturedColumn';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET() {
  try {
    await ensureAlumniFeaturedColumn();

    const result = await pool.query(`
      SELECT 
        a.id,
        a.name,
        a.email,
        a."batchYear",
        a."currentTitle",
        a."currentBio",
	        a."profilePic",
	        a."workLink",
	        a."linkedIn",
	        a."isFeatured",
	        s."schoolName",
        COALESCE(std.stream, 'General') as stream,
        COALESCE(std."standardName", 'Graduated') as "standardName"
      FROM "Alumni" a
      LEFT JOIN "School" s ON a."schoolId" = s.id
      LEFT JOIN "Student" stu ON a."studentId" = stu.id
      LEFT JOIN "Standard" std ON stu."standardId" = std.id
	      ORDER BY a."isFeatured" DESC, a."batchYear" DESC, a.name ASC
    `);

	    return NextResponse.json({ alumni: result.rows }, { headers });
	  } catch (error: any) {
	    console.error('Error fetching public alumni:', error);
	    return NextResponse.json({ error: 'Failed to fetch public alumni' }, { status: 500 });
	  }
	}

export async function OPTIONS() {
  return NextResponse.json({}, { headers });
}
