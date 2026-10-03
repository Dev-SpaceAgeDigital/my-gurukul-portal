import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { uploadMedia, deleteMedia } from '@/lib/storage';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || (session.role !== 'SUB_ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const eventId = formData.get('eventId') as string;
    const mediaType = formData.get('mediaType') as string; // 'IMAGE' or 'VIDEO'
    
    if (!eventId || !mediaType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check event exists
    const eventCheck = await pool.query('SELECT id, "schoolId" FROM "Event" WHERE id = $1', [eventId]);
    if (eventCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventSchoolId = eventCheck.rows[0].schoolId || session.schoolId || 'global';

    let url = '';
    let fileId = null;

    if (mediaType === 'IMAGE') {
      const file = formData.get('file') as File;
      if (!file) return NextResponse.json({ error: 'No image file provided' }, { status: 400 });

      // Size restriction check
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the maximum allowed size of 10MB.` },
          { status: 400 }
        );
      }

      // Convert to buffer and upload
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadRes = await uploadMedia(buffer, file.name, `events/${eventSchoolId}`, true);

      url = uploadRes.secure_url;
      fileId = uploadRes.public_id;
    } else if (mediaType === 'VIDEO') {
      const youtubeUrl = formData.get('url') as string;
      const file = formData.get('file') as File | null;

      if (file && typeof file.arrayBuffer === 'function') {
        if (file.size > MAX_VIDEO_SIZE_BYTES) {
          return NextResponse.json(
            { error: `Video file exceeds the maximum allowed size of 50MB.` },
            { status: 400 }
          );
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadRes = await uploadMedia(buffer, file.name, `events/${eventSchoolId}/videos`, false);
        url = uploadRes.secure_url;
        fileId = uploadRes.public_id;
      } else if (youtubeUrl) {
        url = youtubeUrl.trim();
      } else {
        return NextResponse.json({ error: 'No video URL or video file provided' }, { status: 400 });
      }
    }

    const query = `
      INSERT INTO "EventMedia" ("eventId", "mediaType", "url", "fileId")
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [eventId, mediaType, url, fileId]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Add event media error:', error);
    return NextResponse.json({ error: 'Failed to add media' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || (session.role !== 'SUB_ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('id');

    if (!mediaId) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // Verify it belongs to the school (or superadmin access)
    let checkQuery = `
      SELECT m.* FROM "EventMedia" m
      JOIN "Event" e ON m."eventId" = e.id
      WHERE m.id = $1
    `;
    const checkParams: any[] = [mediaId];
    if (session.role === 'SUB_ADMIN' && session.schoolId) {
      checkQuery += ` AND e."schoolId" = $2`;
      checkParams.push(session.schoolId);
    }

    const checkRes = await pool.query(checkQuery, checkParams);
    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const media = checkRes.rows[0];

    // If it's an image or video in storage, delete it there too
    if (media.fileId) {
      try {
        await deleteMedia(media.fileId);
      } catch (storageError) {
        console.error('Storage deletion error (continuing anyway):', storageError);
      }
    }

    // Delete from database
    await pool.query('DELETE FROM "EventMedia" WHERE id = $1', [mediaId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete event media error:', error);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}
