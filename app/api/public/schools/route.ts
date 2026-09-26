import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { schools, trusts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { withPublicApi } from '@/lib/public-api';

export const GET = withPublicApi(async (req: NextRequest) => {
  const result = await db.select({
    id: schools.id,
    schoolName: schools.schoolName,
    currentStudentsNo: schools.currentStudentsNo,
    address: schools.address,
    phoneNo: schools.phoneNo,
    email: schools.email,
    medium: schools.medium,
    schoolDiseNo: schools.schoolDiseNo,
    isHaveRTE: schools.isHaveRTE,
    sscIndexNo: schools.sscIndexNo,
    hscIndexNo: schools.hscIndexNo,
    establishYear: schools.establishYear,
    totalStandards: schools.totalStandards,
    imageUrls: schools.imageUrls,
    trustId: schools.trustId,
    trustName: trusts.trustName,
    createdAt: schools.createdAt,
    updatedAt: schools.updatedAt
  })
  .from(schools)
  .leftJoin(trusts, eq(schools.trustId, trusts.id))
  .orderBy(desc(schools.createdAt));

  return NextResponse.json(result);
}, { maxRequests: 60, cacheSeconds: 60 });
