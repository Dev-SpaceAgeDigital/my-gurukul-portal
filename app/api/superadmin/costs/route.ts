import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/monitoring';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { schoolId, title, description, type, startDate, estimatedCost } = body;

    if (!schoolId || !title || !type) {
      return NextResponse.json({ error: 'School, Title, and Category Type are required.' }, { status: 400 });
    }

    const insertRes = await pool.query(
      `INSERT INTO "Expense" ("schoolId", title, description, type, "startDate", "estimatedCost", "paidAmount", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [
        schoolId,
        title,
        description || null,
        type, // 'CONSTRUCTION' | 'EVENT' | 'ACADEMIC' | 'GENERAL'
        startDate ? startDate : null,
        estimatedCost ? String(estimatedCost) : '0',
        '0'
      ]
    );

    const newProject = insertRes.rows[0];

    const schoolRes = await pool.query(`SELECT "schoolName" FROM "School" WHERE id = $1`, [schoolId]);
    const schoolName = schoolRes.rows[0]?.schoolName || 'School';

    try {
      await createNotification({
        title: 'New institutional project approved',
        message: `${title} (${type}) project cost added by Trust Governance for ${schoolName}.`,
        type: 'MONITORING',
        priority: 'NORMAL',
        actorRole: 'SUPER_ADMIN',
        actorId: session.userId,
        schoolId,
        entityType: 'Expense',
        entityId: newProject.id,
        link: '/subadmin/accounts?tab=projects',
        audiences: [{ type: 'ROLE', recipientRole: 'SUB_ADMIN' }],
      });

      await logActivity({
        schoolId,
        actorRole: 'SUPER_ADMIN',
        actorId: session.userId,
        actorEmail: session.email,
        category: 'PROJECT',
        action: 'PROJECT_CREATED',
        title: 'Project Cost Added',
        message: `SuperAdmin added project ${title} with budget Rs. ${estimatedCost || 0} for ${schoolName}.`,
        status: 'SUCCESS',
        entityType: 'Expense',
        entityId: newProject.id,
      });
    } catch (e) {
      console.warn('Non-blocking logging error:', e);
    }

    return NextResponse.json({ success: true, project: newProject }, { status: 201 });
  } catch (error: any) {
    console.error('Superadmin create project error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create project' }, { status: 500 });
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

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    await pool.query(`DELETE FROM "Expense" WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Superadmin delete project error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete project' }, { status: 500 });
  }
}
