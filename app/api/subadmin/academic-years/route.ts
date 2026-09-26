import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { academicYears } from '@/lib/db/schema';
import { getSessionFromCookies } from '@/lib/auth';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const years = await db.query.academicYears.findMany({
      orderBy: [desc(academicYears.createdAt)],
    });

    return NextResponse.json(years);
  } catch (error) {
    console.error('Subadmin academic years fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
