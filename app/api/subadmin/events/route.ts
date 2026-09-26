import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { broadcastEmailToAlumni } from '@/lib/notifyAlumniByEmail';
import { logActivity } from '@/lib/monitoring';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get events and their associated media
    const eventsQuery = `
      SELECT 
        e.*,
        json_agg(
          json_build_object(
            'id', m.id,
            'mediaType', m."mediaType",
            'url', m.url,
            'fileId', m."fileId"
          )
        ) FILTER (WHERE m.id IS NOT NULL) as media
      FROM "Event" e
      LEFT JOIN "EventMedia" m ON e.id = m."eventId"
      WHERE e."schoolId" = $1
      GROUP BY e.id
      ORDER BY e.date DESC, e."createdAt" DESC
    `;

    const result = await pool.query(eventsQuery, [session.schoolId]);
    
    // Default media to empty array if null
    const events = result.rows.map(row => ({
      ...row,
      media: row.media || []
    }));

    return NextResponse.json(events);
  } catch (error) {
    console.error('Fetch events error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, tagline, description, points, featuredImage, date, category } = await request.json();

    if (!title || !date) {
      return NextResponse.json({ error: 'Title and Date are required' }, { status: 400 });
    }

    const query = `
      INSERT INTO "Event" (title, tagline, description, points, "featuredImage", date, category, "schoolId")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await pool.query(query, [
      title,
      tagline || null,
      description || null,
      JSON.stringify(points || []),
      featuredImage || null,
      date,
      category || 'General',
      session.schoolId
    ]);

    await createNotification({
      title: 'New school event added',
      message: title,
      type: 'CONTENT',
      priority: 'NORMAL',
      actorRole: 'SUB_ADMIN',
      actorId: session.userId,
      schoolId: session.schoolId,
      entityType: 'Event',
      entityId: result.rows[0].id,
      link: '/alumni/dashboard',
      audiences: [
        { type: 'ROLE', recipientRole: 'SUPER_ADMIN' },
        { type: 'SCHOOL_ALUMNI', schoolId: session.schoolId },
      ],
    });

    await logActivity({
      schoolId: session.schoolId,
      actorRole: 'SUB_ADMIN',
      actorId: session.userId,
      actorEmail: session.email,
      category: 'EVENT',
      action: 'EVENT_CREATED',
      title: 'New school event added',
      message: title,
      status: 'SUCCESS',
      entityType: 'Event',
      entityId: result.rows[0].id,
      link: '/subadmin/school-hub?tab=events',
    });

    // Send broadcast email notification to all registered alumni of this school
    broadcastEmailToAlumni({
      schoolId: session.schoolId,
      type: 'EVENT',
      title,
      description: tagline ? `${tagline}\n\n${description || ''}` : description,
      date,
      category: category || 'Event',
      imageUrl: featuredImage || null,
      sourceRole: 'SUB_ADMIN',
      sourceId: session.userId,
      sourceName: session.email,
      relatedEntityType: 'Event',
      relatedEntityId: result.rows[0].id,
    }).catch((err) => console.error('Error broadcasting event email:', err));

    return NextResponse.json({ ...result.rows[0], media: [] }, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, title, tagline, description, points, featuredImage, date, category } = await request.json();

    if (!id || !title || !date) {
      return NextResponse.json({ error: 'ID, Title, and Date are required' }, { status: 400 });
    }

    const query = `
      UPDATE "Event"
      SET title = $1, tagline = $2, description = $3, points = $4, "featuredImage" = $5, date = $6, category = $7, "updatedAt" = NOW()
      WHERE id = $8 AND "schoolId" = $9
      RETURNING *
    `;
    const result = await pool.query(query, [
      title,
      tagline || null,
      description || null,
      JSON.stringify(points || []),
      featuredImage || null,
      date,
      category || 'General',
      id,
      session.schoolId
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found or unauthorized' }, { status: 404 });
    }

    // Also get the media for the updated event
    const mediaQuery = `SELECT id, "mediaType", url, "fileId" FROM "EventMedia" WHERE "eventId" = $1`;
    const mediaResult = await pool.query(mediaQuery, [id]);

    return NextResponse.json({
      ...result.rows[0],
      media: mediaResult.rows || []
    });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await pool.query('DELETE FROM "Event" WHERE id = $1 AND "schoolId" = $2', [id, session.schoolId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
