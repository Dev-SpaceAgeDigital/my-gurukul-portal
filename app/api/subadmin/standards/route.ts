import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

// GET all standards for the assigned school
export async function GET() {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!session.schoolId) {
      return NextResponse.json({ error: 'No school assigned' }, { status: 400 });
    }

    const result = await query(
      'SELECT * FROM "Standard" WHERE "schoolId" = $1 ORDER BY "standardName" ASC',
      [session.schoolId]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Fetch standards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new standard
export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!session.schoolId) {
      return NextResponse.json({ error: 'No school assigned' }, { status: 400 });
    }

    const { standardName, division, stream, fees, batchYear } = await request.json();

    if (!standardName) {
      return NextResponse.json({ error: 'Standard name is required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO "Standard" (id, "standardName", division, stream, fees, "batchYear", "schoolId", "createdAt", "updatedAt") 
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()) 
       RETURNING *`,
      [standardName, division || null, stream || null, fees || 0, batchYear || null, session.schoolId]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Create standard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update standard
export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id, standardName, division, stream, fees, batchYear } = await request.json();

    if (!id || !standardName) {
      return NextResponse.json({ error: 'ID and Standard name are required' }, { status: 400 });
    }

    // Verify ownership
    const check = await query('SELECT "schoolId" FROM "Standard" WHERE id = $1', [id]);
    if (check.rowCount === 0 || check.rows[0].schoolId !== session.schoolId) {
      return NextResponse.json({ error: 'Standard not found or unauthorized' }, { status: 404 });
    }

    const result = await query(
      `UPDATE "Standard" SET "standardName" = $1, division = $2, stream = $3, fees = $4, "batchYear" = $5, "updatedAt" = NOW() 
       WHERE id = $6 RETURNING *`,
      [standardName, division || null, stream || null, fees || 0, batchYear || null, id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Update standard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE standard
export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // Verify ownership
    const check = await query('SELECT "schoolId" FROM "Standard" WHERE id = $1', [id]);
    if (check.rowCount === 0 || check.rows[0].schoolId !== session.schoolId) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await query('DELETE FROM "Standard" WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete standard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
