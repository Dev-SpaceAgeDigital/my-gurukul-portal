import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { ensureNotificationTable } from '@/lib/notifications';

function startOfLocalDay(offsetDays = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

function groupByDay(rows: any[]) {
  const todayStart = startOfLocalDay(0).getTime();
  const tomorrowStart = startOfLocalDay(1).getTime();
  const yesterdayStart = startOfLocalDay(-1).getTime();

  return rows.reduce(
    (groups, row) => {
      const time = new Date(row.createdAt).getTime();
      if (time >= todayStart && time < tomorrowStart) groups.today.push(row);
      else if (time >= yesterdayStart && time < todayStart) groups.yesterday.push(row);
      else groups.older.push(row);
      return groups;
    },
    { today: [] as any[], yesterday: [] as any[], older: [] as any[] }
  );
}

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureNotificationTable();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');

    const params: any[] = [session.userId, session.role];
    const filters = ['"recipientId" = $1', '"recipientRole" = $2'];

    if (type && type !== 'ALL') {
      params.push(type);
      filters.push(`type = $${params.length}`);
    }

    if (priority && priority !== 'ALL') {
      params.push(priority);
      filters.push(`priority = $${params.length}`);
    }

    const result = await pool.query(
      `SELECT
        n.*,
        s."schoolName"
       FROM "Notification" n
       LEFT JOIN "School" s ON s.id::text = n."schoolId"
       WHERE ${filters.join(' AND ')}
       ORDER BY n."createdAt" DESC
       LIMIT 200`,
      params
    );

    const grouped = groupByDay(result.rows);
    const counts = result.rows.reduce(
      (acc, item) => {
        acc.total += 1;
        acc.unread += item.isRead ? 0 : 1;
        acc.byType[item.type] = (acc.byType[item.type] || 0) + 1;
        return acc;
      },
      { total: 0, unread: 0, byType: {} as Record<string, number> }
    );

    return NextResponse.json({ grouped, counts });
  } catch (error) {
    console.error('Monitoring fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
