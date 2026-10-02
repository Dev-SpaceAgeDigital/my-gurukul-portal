import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { broadcastEmailToAlumni } from '@/lib/notifyAlumniByEmail';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedSchoolId = searchParams.get('schoolId');

    const params: any[] = [];
    const whereClause = requestedSchoolId && requestedSchoolId !== 'ALL'
      ? 'WHERE e."schoolId" = $1'
      : '';
    if (whereClause) params.push(requestedSchoolId);

    const eventsQuery = `
      SELECT 
        e.*,
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
    const schoolsRes = await pool.query('SELECT id, "schoolName" FROM "School" ORDER BY "schoolName" ASC');

    const events = result.rows.map((row) => ({
      ...row,
      media: row.media || [],
    }));

    return NextResponse.json({ events, schools: schoolsRes.rows });
  } catch (error) {
    console.error('Superadmin fetch events error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, tagline, description, points, featuredImage, date, category, schoolId } = await request.json();

    if (!title || !date || !schoolId) {
      return NextResponse.json({ error: 'Title, School, and Date are required' }, { status: 400 });
    }

    const insertQuery = `
      INSERT INTO "Event" (title, tagline, description, points, "featuredImage", date, category, "schoolId")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      title,
      tagline || '',
      description || '',
      points || [],
      featuredImage || '',
      date,
      category || 'School Life',
      schoolId,
    ]);

    const newEvent = result.rows[0];

    // Dispatch notifications & emails
    try {
      await createNotification({
        title: 'New campus memory published',
        message: title,
        type: 'CONTENT',
        priority: 'NORMAL',
        actorRole: 'SUPER_ADMIN',
        actorId: session.userId,
        schoolId,
        entityType: 'Event',
        entityId: newEvent.id,
        link: '/alumni/dashboard?tab=memories',
        audiences: [{ type: 'SCHOOL_ALUMNI', schoolId }],
      });

      broadcastEmailToAlumni({
        schoolId,
        type: 'EVENT',
        title,
        description: description || tagline || 'A new campus memory and event album was published.',
        date,
        category: category || 'School Life',
        imageUrl: featuredImage || null,
        sourceRole: 'SUPER_ADMIN',
        sourceId: session.userId,
        sourceName: session.email,
        relatedEntityType: 'Event',
        relatedEntityId: newEvent.id,
      }).catch((err) => console.error('Error broadcasting event memory email:', err));
    } catch (e) {
      console.warn('Non-blocking notification error:', e);
    }

    return NextResponse.json({ ...newEvent, media: [] }, { status: 201 });
  } catch (error) {
    console.error('Superadmin create event error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, title, tagline, description, points, featuredImage, date, category, schoolId } = await request.json();

    if (!id || !title || !date) {
      return NextResponse.json({ error: 'ID, Title, and Date are required' }, { status: 400 });
    }

    const updateQuery = `
      UPDATE "Event"
      SET title = $1,
          tagline = $2,
          description = $3,
          points = $4,
          "featuredImage" = $5,
          date = $6,
          category = $7,
          "schoolId" = COALESCE($8, "schoolId")
      WHERE id = $9
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      title,
      tagline || '',
      description || '',
      points || [],
      featuredImage || '',
      date,
      category || 'School Life',
      schoolId || null,
      id,
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Superadmin update event error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });

    // Cleanup images from storage
    const mediaRes = await pool.query('SELECT "fileId", url FROM "EventMedia" WHERE "eventId" = $1', [id]);
    const { deleteMedia } = await import('@/lib/storage');
    for (const item of mediaRes.rows) {
      if (item.fileId || item.url) {
        try { await deleteMedia(item.fileId || item.url); } catch {}
      }
    }

    await pool.query('DELETE FROM "Event" WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Superadmin delete event error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}

