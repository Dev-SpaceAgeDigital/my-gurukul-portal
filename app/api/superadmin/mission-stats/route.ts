import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { missionStats } from '@/lib/db/schema';
import { getSessionFromCookies } from '@/lib/auth';
import { eq, asc } from 'drizzle-orm';

const defaultStats = [
  { target: 1100, prefix: "", suffix: "+", label: "Students Currently Studying", desc: "Across all 4 trust schools", orderNo: 1, isActive: true },
  { target: 3, prefix: "", suffix: "", label: "Schools Under the Trust", desc: "Across 2 cities in Gujarat", orderNo: 2, isActive: true },
  { target: 30, prefix: "", suffix: " Yrs", label: "Of Uninterrupted Service", desc: "Since our founding in 1996", orderNo: 3, isActive: true },
  { target: 3000, prefix: "", suffix: "+", label: "Alumni in Careers", desc: "Doctors, engineers & more", orderNo: 4, isActive: true },
];

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let stats = await db.query.missionStats.findMany({
      orderBy: [asc(missionStats.orderNo)],
    });

    // Auto-seed default stats if table is empty
    if (stats.length === 0) {
      const inserted = await db.insert(missionStats).values(defaultStats).returning();
      stats = inserted.sort((a, b) => (a.orderNo || 0) - (b.orderNo || 0));
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Mission stats fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { target, prefix, suffix, label, desc, orderNo, isActive } = await request.json();

    if (target === undefined || !label || !desc) {
      return NextResponse.json({ error: 'Target, label, and description are required' }, { status: 400 });
    }

    const [newStat] = await db.insert(missionStats).values({
      target: Number(target),
      prefix: prefix || "",
      suffix: suffix || "",
      label,
      desc,
      orderNo: Number(orderNo || 1),
      isActive: isActive !== undefined ? isActive : true,
    }).returning();

    return NextResponse.json(newStat);
  } catch (error) {
    console.error('Mission stat creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, target, prefix, suffix, label, desc, orderNo, isActive } = await request.json();

    if (!id || target === undefined || !label || !desc) {
      return NextResponse.json({ error: 'ID, target, label, and description are required' }, { status: 400 });
    }

    const [updatedStat] = await db.update(missionStats)
      .set({
        target: Number(target),
        prefix: prefix || "",
        suffix: suffix || "",
        label,
        desc,
        orderNo: Number(orderNo || 1),
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      })
      .where(eq(missionStats.id, id))
      .returning();

    return NextResponse.json(updatedStat);
  } catch (error) {
    console.error('Mission stat update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.delete(missionStats).where(eq(missionStats.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mission stat deletion error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
