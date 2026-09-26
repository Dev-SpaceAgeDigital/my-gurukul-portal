import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const schoolId = searchParams.get('schoolId');

    let query = `
      SELECT 
        aoy.*,
        a.name as "alumniName",
        a.email as "alumniEmail",
        a."profilePic" as "alumniProfilePic",
        a."currentTitle" as "alumniCurrentTitle",
        a."currentBio" as "alumniCurrentBio",
        a."batchYear" as "alumniBatchYear",
        a."linkedIn" as "alumniLinkedIn",
        s."schoolName" as "schoolName"
      FROM "AlumniOfTheYear" aoy
      JOIN "Alumni" a ON aoy."alumniId" = a.id
      LEFT JOIN "School" s ON aoy."schoolId" = s.id
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (yearParam) {
      params.push(parseInt(yearParam, 10));
      conditions.push(`aoy.year = $${params.length}`);
    }

    if (schoolId) {
      params.push(schoolId);
      conditions.push(`(aoy."schoolId" = $${params.length} OR aoy."schoolId" IS NULL)`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY aoy.year DESC, aoy."createdAt" DESC LIMIT 1`;

    const res = await pool.query(query, params);

    if (res.rows.length === 0) {
      // If no winner is set in DB yet, return a fallback default featured alumni winner structure
      return NextResponse.json({
        id: 'default-2026',
        year: 2026,
        alumniName: 'Fatima Vohra',
        alumniProfilePic: '/images/img-101.jpg',
        alumniCurrentTitle: 'Senior Software Engineer @ TechCorp',
        alumniBatchYear: '2018-19',
        schoolName: 'Sabri High School, Karjan',
        headline: 'Top Educational Aid & Computer Lab Sponsor 2026',
        reason: 'Fatima sponsored education fees for 8 underprivileged students and donated 10 laptops to establish the school digital lab.',
        highlights: [
          'Sponsored education fees for 8 underprivileged students',
          'Donated 10 Laptops for Sabri High School Digital Lab',
          'Conducted 6 1-on-1 Career & Engineering Mentorship Sessions'
        ],
        totalFinancialAid: 120000,
        studentsHelpedCount: 8,
        jobsPostedCount: 3,
        mentorshipsCount: 6,
        isFallback: true
      });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    console.error('Error fetching public Alumni of the Year:', error);
    return NextResponse.json({ error: 'Failed to fetch Alumni of the Year' }, { status: 500 });
  }
}
