import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies('ALUMNI');
    if (!session || session.role !== 'ALUMNI') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedSchoolId = searchParams.get('schoolId');
    const requestedYear = searchParams.get('year');
    const requestedCategory = searchParams.get('category');
    const searchTerm = searchParams.get('search');

    const conditions: string[] = [];
    const params: any[] = [];

    // Filter by school: if requested is 'ALL', show all schools; else if specific school; else default to alumnus schoolId
    if (requestedSchoolId && requestedSchoolId !== 'ALL' && requestedSchoolId !== 'all') {
      params.push(requestedSchoolId);
      conditions.push(`e."schoolId" = $${params.length}`);
    } else if (!requestedSchoolId && session.schoolId) {
      // Default to alumnus's school if no explicit schoolId requested
      params.push(session.schoolId);
      conditions.push(`e."schoolId" = $${params.length}`);
    }

    if (requestedYear && requestedYear !== 'ALL' && requestedYear !== 'all') {
      params.push(requestedYear);
      conditions.push(`EXTRACT(YEAR FROM e.date)::text = $${params.length}`);
    }

    if (requestedCategory && requestedCategory !== 'ALL' && requestedCategory !== 'all') {
      params.push(requestedCategory);
      conditions.push(`e.category = $${params.length}`);
    }

    if (searchTerm && searchTerm.trim()) {
      params.push(`%${searchTerm.trim()}%`);
      conditions.push(`(e.title ILIKE $${params.length} OR e.description ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const eventsQuery = `
      SELECT 
        e.*,
        EXTRACT(YEAR FROM e.date)::text as "eventYear",
        s."schoolName",
        json_agg(
          json_build_object(
            'id', m.id,
            'mediaType', m."mediaType",
            'url', m.url,
            'fileId', m."fileId"
          ) ORDER BY m."createdAt" ASC
        ) FILTER (WHERE m.id IS NOT NULL) as media
      FROM "Event" e
      LEFT JOIN "EventMedia" m ON e.id = m."eventId"
      LEFT JOIN "School" s ON e."schoolId" = s.id
      ${whereClause}
      GROUP BY e.id, s."schoolName"
      ORDER BY e.date DESC, e."createdAt" DESC
    `;

    const result = await pool.query(eventsQuery, params);

    // Fetch list of available schools and distinct event years for filter controls
    const schoolsRes = await pool.query('SELECT id, "schoolName" FROM "School" ORDER BY "schoolName" ASC');
    const yearsRes = await pool.query(`
      SELECT DISTINCT EXTRACT(YEAR FROM date)::text as year 
      FROM "Event" 
      WHERE date IS NOT NULL 
      ORDER BY year DESC
    `);

    const events = result.rows.map((row) => ({
      ...row,
      media: row.media || [],
    }));

    return NextResponse.json({
      events,
      schools: schoolsRes.rows,
      years: yearsRes.rows.map((r) => r.year).filter(Boolean),
    });
  } catch (error) {
    console.error('Fetch alumni memories error:', error);
    return NextResponse.json({ error: 'Failed to fetch school memories' }, { status: 500 });
  }
}
