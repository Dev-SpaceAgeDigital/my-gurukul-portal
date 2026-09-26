import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { ensureCsrTables, normalizeCsrStatus } from '@/lib/csr';
import { logActivity } from '@/lib/monitoring';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export async function GET(req: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || !['SUPER_ADMIN', 'SUB_ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const limit = await checkRateLimit(req, 'authRead', session.userId);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    await ensureCsrTables();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ALL';
    const source = searchParams.get('source') || 'ALL';
    const search = `%${(searchParams.get('search') || '').trim()}%`;
    const values: unknown[] = [search];
    const filters = [`(
      "companyName" ILIKE $1 OR "contactPerson" ILIKE $1 OR email ILIKE $1 OR
      COALESCE("schoolName", '') ILIKE $1 OR COALESCE(category, '') ILIKE $1
    )`];

    if (status !== 'ALL') {
      values.push(normalizeCsrStatus(status));
      filters.push(`status = $${values.length}`);
    }

    if (source !== 'ALL') {
      values.push(source.toUpperCase());
      filters.push(`source = $${values.length}`);
    }

    if (session.role === 'SUB_ADMIN') {
      values.push(session.schoolId);
      filters.push(`"schoolId" = $${values.length}`);
    }

    const result = await pool.query(
      `SELECT * FROM "CsrInquiry"
       WHERE ${filters.join(' AND ')}
       ORDER BY "createdAt" DESC
       LIMIT 150`,
      values
    );

    const statsRes = await pool.query(
      `SELECT status, COUNT(*)::int as count
       FROM "CsrInquiry"
       ${session.role === 'SUB_ADMIN' ? 'WHERE "schoolId" = $1' : ''}
       GROUP BY status`,
      session.role === 'SUB_ADMIN' ? [session.schoolId] : []
    );

    return NextResponse.json({ inquiries: result.rows, stats: statsRes.rows });
  } catch (error) {
    console.error('CSR admin fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch CSR inquiries' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || !['SUPER_ADMIN', 'SUB_ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const limit = await checkRateLimit(req, 'mutation', session.userId);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    await ensureCsrTables();
    const body = await req.json();
    const id = String(body.id || '').trim();
    const status = normalizeCsrStatus(body.status);
    const notes = String(body.notes || '').trim();

    if (!id) return NextResponse.json({ error: 'CSR inquiry ID is required' }, { status: 400 });

    const values: unknown[] = [status, notes || null, id];
    const schoolFilter = session.role === 'SUB_ADMIN' ? 'AND "schoolId" = $4' : '';
    if (session.role === 'SUB_ADMIN') values.push(session.schoolId);

    const result = await pool.query(
      `UPDATE "CsrInquiry"
       SET status = $1, notes = COALESCE($2, notes), "updatedAt" = NOW()
       WHERE id = $3 ${schoolFilter}
       RETURNING *`,
      values
    );

    const inquiry = result.rows[0];
    if (!inquiry) return NextResponse.json({ error: 'CSR inquiry not found' }, { status: 404 });

    await logActivity({
      schoolId: inquiry.schoolId,
      actorRole: session.role,
      actorId: session.userId,
      actorEmail: session.email,
      category: 'CSR',
      action: 'CSR_STATUS_UPDATED',
      title: 'CSR status updated',
      message: `${inquiry.companyName} status changed to ${status}.`,
      status,
      entityType: 'CsrInquiry',
      entityId: inquiry.id,
      link: session.role === 'SUB_ADMIN' ? '/subadmin/csr' : '/superadmin/csr',
    });

    return NextResponse.json({ success: true, inquiry });
  } catch (error) {
    console.error('CSR admin update error:', error);
    return NextResponse.json({ error: 'Failed to update CSR inquiry' }, { status: 500 });
  }
}
