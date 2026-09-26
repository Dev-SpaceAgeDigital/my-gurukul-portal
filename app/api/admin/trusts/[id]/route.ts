import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const result = await query('SELECT * FROM "Trust" WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Trust not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch trust error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
