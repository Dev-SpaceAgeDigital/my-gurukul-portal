import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { academicYears } from '@/lib/db/schema';
import { getSessionFromCookies } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const years = await db.query.academicYears.findMany({
      orderBy: [desc(academicYears.createdAt)],
    });

    return NextResponse.json(years);
  } catch (error) {
    console.error('Academic years fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { label, isActive, statusTag } = await request.json();

    if (!label) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400 });
    }

    // If making this year active, deactivate others
    if (isActive) {
      await db.update(academicYears).set({ isActive: false });
    }

    const [newYear] = await db.insert(academicYears).values({
      label,
      isActive: isActive || false,
      statusTag: statusTag || 'CURRENT',
    }).returning();

    return NextResponse.json(newYear);
  } catch (error) {
    console.error('Academic year creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, label, isActive, statusTag } = await request.json();

    if (!id || !label) {
      return NextResponse.json({ error: 'ID and Label are required' }, { status: 400 });
    }

    if (isActive) {
      await db.update(academicYears).set({ isActive: false });
    }

    const [updatedYear] = await db.update(academicYears)
      .set({
        label,
        isActive: isActive || false,
        statusTag: statusTag || 'CURRENT',
        updatedAt: new Date(),
      })
      .where(eq(academicYears.id, id))
      .returning();

    return NextResponse.json(updatedYear);
  } catch (error) {
    console.error('Academic year update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
