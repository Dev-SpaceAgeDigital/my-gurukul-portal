import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { standards } from '@/lib/db/schema';
import { getSessionFromCookies } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    if (!schoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
    }

    const schoolStandards = await db.query.standards.findMany({
      where: eq(standards.schoolId, schoolId),
      orderBy: [standards.standardName],
    });

    return NextResponse.json(schoolStandards);
  } catch (error) {
    console.error('SuperAdmin standards fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
