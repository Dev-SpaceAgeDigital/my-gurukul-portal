import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { broadcastEmailToAlumni } from '@/lib/notifyAlumniByEmail';
import { logActivity } from '@/lib/monitoring';

function canManage(session: any) {
  return session?.role === 'SUPER_ADMIN' || session?.role === 'SUB_ADMIN';
}

async function resolveSchoolId(session: any, requestedSchoolId: string | null) {
  if (session.role === 'SUB_ADMIN') return session.schoolId || null;
  if (!requestedSchoolId || requestedSchoolId === 'ALL' || requestedSchoolId === 'all' || requestedSchoolId === 'undefined' || requestedSchoolId === 'null' || requestedSchoolId.trim() === '') {
    return null;
  }
  return requestedSchoolId.trim();
}

function isMissingNewsTable(error: any) {
  return error?.code === '42P01' || String(error?.message || '').includes('NewsUpdate');
}

export async function GET() {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || !canManage(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const params: any[] = [];
    const where = session.role === 'SUB_ADMIN' && session.schoolId
      ? 'WHERE n."schoolId" = $1'
      : '';

    if (where) params.push(session.schoolId);

    const result = await pool.query(`
      SELECT n.*, s."schoolName"
      FROM "NewsUpdate" n
      LEFT JOIN "School" s ON n."schoolId" = s.id
      ${where}
      ORDER BY COALESCE(n."publishDate", n."createdAt"::date) DESC, n."createdAt" DESC
    `, params);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('News updates fetch error:', error);
    if (isMissingNewsTable(error)) {
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || !canManage(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const publishDate = formData.get('publishDate') as string;
    const requestedSchoolId = formData.get('schoolId') as string | null;
    const isActive = formData.get('isActive') !== 'false';
    const schoolId = await resolveSchoolId(session, requestedSchoolId);

    if (!title || !description || !category) {
      return NextResponse.json({ error: 'Title, category, and description are required' }, { status: 400 });
    }

    let imageUrl = '';
    let imageFileId = '';
    const file = formData.get('file') as File | null;

    if (file && file.size > 0) {
      const { uploadMedia } = await import('@/lib/storage');
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult: any = await uploadMedia(buffer, file.name, 'public/news-updates', true);
      imageUrl = uploadResult.secure_url;
      imageFileId = uploadResult.public_id;
    }

    const result = await pool.query(`
      INSERT INTO "NewsUpdate"
        (title, description, category, "publishDate", "imageUrl", "imageFileId", "schoolId", "isActive", "createdByRole")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [title, description, category, publishDate || null, imageUrl || null, imageFileId || null, schoolId, isActive, session.role]);

    const audiences: any[] = [];
    if (schoolId) {
      audiences.push({ type: 'SCHOOL_ALUMNI', schoolId });
      if (session.role === 'SUB_ADMIN') {
        audiences.push({ type: 'ROLE', recipientRole: 'SUPER_ADMIN' });
      }
    } else {
      audiences.push({ type: 'ROLE', recipientRole: 'SUPER_ADMIN' });
    }

    await createNotification({
      title: 'Campus update published',
      message: title,
      type: 'CONTENT',
      priority: 'NORMAL',
      actorRole: session.role,
      actorId: session.userId,
      schoolId,
      entityType: 'NewsUpdate',
      entityId: result.rows[0].id,
      link: session.role === 'SUPER_ADMIN' ? '/superadmin/updates' : '/subadmin/updates',
      audiences,
    });

    if (session.role === 'SUB_ADMIN') {
      await logActivity({
        schoolId,
        actorRole: 'SUB_ADMIN',
        actorId: session.userId,
        actorEmail: session.email,
        category: 'UPDATE',
        action: 'NEWS_UPDATE_PUBLISHED',
        title: 'Campus update published',
        message: title,
        status: 'SUCCESS',
        entityType: 'NewsUpdate',
        entityId: result.rows[0].id,
        link: '/subadmin/school-hub?tab=updates',
      });
    }

    if (schoolId) {
      broadcastEmailToAlumni({
        schoolId,
        type: 'UPDATE',
        title,
        description,
        date: publishDate || new Date().toISOString().split('T')[0],
        category: category || 'Announcement',
        imageUrl: imageUrl || null,
        sourceRole: session.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'SUB_ADMIN',
        sourceId: session.userId,
        sourceName: session.email,
        relatedEntityType: 'NewsUpdate',
        relatedEntityId: result.rows[0].id,
      }).catch((err) => console.error('Error broadcasting news update email:', err));
    }

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('News update create error:', error);
    if (isMissingNewsTable(error)) {
      return NextResponse.json({ error: 'Updates table is not ready. Please run the database migration first.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || !canManage(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const publishDate = formData.get('publishDate') as string;
    const requestedSchoolId = formData.get('schoolId') as string | null;
    const isActive = formData.get('isActive') !== 'false';

    if (!id || !title || !description || !category) {
      return NextResponse.json({ error: 'ID, title, category, and description are required' }, { status: 400 });
    }

    const checkParams = session.role === 'SUB_ADMIN' ? [id, session.schoolId] : [id];
    const checkWhere = session.role === 'SUB_ADMIN' ? 'id = $1 AND "schoolId" = $2' : 'id = $1';
    const existing = await pool.query(`SELECT * FROM "NewsUpdate" WHERE ${checkWhere}`, checkParams);

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'News update not found' }, { status: 404 });
    }

    let imageUrl = existing.rows[0].imageUrl;
    let imageFileId = existing.rows[0].imageFileId;
    const file = formData.get('file') as File | null;

    if (file && file.size > 0) {
      const { uploadMedia, deleteMedia } = await import('@/lib/storage');
      if (imageFileId || imageUrl) {
        try { await deleteMedia(imageFileId || imageUrl); } catch {}
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult: any = await uploadMedia(buffer, file.name, 'public/news-updates', true);
      imageUrl = uploadResult.secure_url;
      imageFileId = uploadResult.public_id;
    }

    const schoolId = await resolveSchoolId(session, requestedSchoolId);
    const result = await pool.query(`
      UPDATE "NewsUpdate"
      SET title = $1,
          description = $2,
          category = $3,
          "publishDate" = $4,
          "imageUrl" = $5,
          "imageFileId" = $6,
          "schoolId" = $7,
          "isActive" = $8,
          "updatedAt" = NOW()
      WHERE id = $9
      RETURNING *
    `, [title, description, category, publishDate || null, imageUrl || null, imageFileId || null, schoolId, isActive, id]);

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('News update edit error:', error);
    if (isMissingNewsTable(error)) {
      return NextResponse.json({ error: 'Updates table is not ready. Please run the database migration first.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || !canManage(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const params = session.role === 'SUB_ADMIN' ? [id, session.schoolId] : [id];
    const where = session.role === 'SUB_ADMIN' ? 'id = $1 AND "schoolId" = $2' : 'id = $1';
    const existing = await pool.query(`SELECT * FROM "NewsUpdate" WHERE ${where}`, params);

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'News update not found' }, { status: 404 });
    }

    if (existing.rows[0].imageFileId || existing.rows[0].imageUrl) {
      const { deleteMedia } = await import('@/lib/storage');
      try { await deleteMedia(existing.rows[0].imageFileId || existing.rows[0].imageUrl); } catch {}
    }

    await pool.query(`DELETE FROM "NewsUpdate" WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('News update delete error:', error);
    if (isMissingNewsTable(error)) {
      return NextResponse.json({ error: 'Updates table is not ready. Please run the database migration first.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
