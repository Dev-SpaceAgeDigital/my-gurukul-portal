import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { missionStats } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { withPublicApi } from '@/lib/public-api';

const defaultStats = [
  { id: "stat-1", target: 1100, prefix: "", suffix: "+", label: "Students Currently Studying", desc: "Across all 4 trust schools", orderNo: 1, isActive: true },
  { id: "stat-2", target: 3, prefix: "", suffix: "", label: "Schools Under the Trust", desc: "Across 2 cities in Gujarat", orderNo: 2, isActive: true },
  { id: "stat-3", target: 30, prefix: "", suffix: " Yrs", label: "Of Uninterrupted Service", desc: "Since our founding in 1996", orderNo: 3, isActive: true },
  { id: "stat-4", target: 3000, prefix: "", suffix: "+", label: "Alumni in Careers", desc: "Doctors, engineers & more", orderNo: 4, isActive: true },
];

export const GET = withPublicApi(async (req: NextRequest) => {
  try {
    const stats = await db.select()
      .from(missionStats)
      .where(eq(missionStats.isActive, true))
      .orderBy(asc(missionStats.orderNo));

    if (!stats || stats.length === 0) {
      return NextResponse.json(defaultStats);
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Public mission stats fetch error:', error);
    return NextResponse.json(defaultStats);
  }
}, { maxRequests: 60, cacheSeconds: 30 });
