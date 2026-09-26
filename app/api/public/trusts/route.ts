import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trusts } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { withPublicApi } from '@/lib/public-api';

export const GET = withPublicApi(async () => {
  const result = await db.select({
    id: trusts.id,
    trustName: trusts.trustName,
    registrationNo: trusts.registrationNo,
    establishmentYear: trusts.establishmentYear,
    presidentName: trusts.presidentName,
    presidentNo: trusts.presidentNo,
    trusteesName: trusts.trusteesName,
    trusteesNo: trusts.trusteesNo,
    createdAt: trusts.createdAt,
    updatedAt: trusts.updatedAt,
  })
  .from(trusts)
  .orderBy(desc(trusts.createdAt));

  return NextResponse.json(result);
}, { maxRequests: 60, cacheSeconds: 60 });
