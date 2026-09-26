import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { expenses, schools } from '@/lib/db/schema';
import { getSessionFromCookies } from '@/lib/auth';
import { deleteMedia, uploadMedia } from '@/lib/storage';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/monitoring';
import { desc, eq, and } from 'drizzle-orm';

function getMediaUrls(mediaUrl?: string | null) {
  if (!mediaUrl) return [];
  try {
    const parsed = JSON.parse(mediaUrl);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string' && item) : [mediaUrl];
  } catch {
    return [mediaUrl];
  }
}

function normalizeExpenseMedia<T extends { mediaUrl?: string | null; mediaType?: string | null }>(expense: T) {
  const mediaUrls = getMediaUrls(expense.mediaUrl);
  return {
    ...expense,
    mediaUrl: mediaUrls[0] || null,
    mediaUrls,
    mediaType: mediaUrls.length ? 'IMAGE' : expense.mediaType,
  };
}

async function deleteExpenseMedia(mediaUrl?: string | null) {
  const urls = getMediaUrls(mediaUrl);
  await Promise.all(urls.map(async (url) => {
    try { await deleteMedia(url); } catch {}
  }));
}

async function uploadProjectPhotos(files: File[], folderPath: string) {
  if (files.length > 5) {
    throw new Error('Maximum 5 photos are allowed.');
  }

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      throw new Error('Only photo uploads are allowed for project media.');
    }
  }

  const urls: string[] = [];
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadResult: any = await uploadMedia(buffer, file.name, folderPath, true);
    urls.push(uploadResult.secure_url);
  }
  return urls;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    const id = searchParams.get('id');

    const session = await getSessionFromCookies('SUB_ADMIN');
    if (!session || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (id) {
      const expense = await db.query.expenses.findFirst({
        where: and(eq(expenses.id, id), eq(expenses.schoolId, session.schoolId)),
      });

      if (!expense) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      return NextResponse.json(normalizeExpenseMedia(expense));
    }

    const result = await db.query.expenses.findMany({
      where: eq(expenses.schoolId, session.schoolId),
      orderBy: [desc(expenses.createdAt)],
      limit: limit,
      offset: offset,
    });

    return NextResponse.json(result.map(normalizeExpenseMedia));
  } catch (error: any) {
    console.error('Failed to fetch expenses:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies('SUB_ADMIN');
    if (!session || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const startDate = formData.get('startDate') as string;
    const estimatedCost = formData.get('estimatedCost') as string;
    const files = formData.getAll('media').filter((item): item is File => item instanceof File && item.size > 0);

    if (!id || !title || !type) {
      return NextResponse.json({ error: 'Project id, title, and type are required' }, { status: 400 });
    }

    const existing = await db.query.expenses.findFirst({
      where: and(eq(expenses.id, id), eq(expenses.schoolId, session.schoolId)),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    let mediaUrl = existing.mediaUrl;
    let mediaType = existing.mediaType;

    if (files.length > 0) {
      const school = await db.query.schools.findFirst({
        where: eq(schools.id, session.schoolId),
        columns: { schoolName: true }
      });

      const schoolName = school?.schoolName || 'UnknownSchool';
      const folderPath = `${schoolName}/construction-event-cost`;
      await deleteExpenseMedia(existing.mediaUrl);
      const urls = await uploadProjectPhotos(files, folderPath);
      mediaUrl = JSON.stringify(urls);
      mediaType = 'IMAGE';
    }

    const [updatedExpense] = await db.update(expenses)
      .set({
        title,
        description: description || null,
        type,
        startDate: startDate ? startDate : null,
        estimatedCost: estimatedCost || '0',
        mediaUrl,
        mediaType,
        updatedAt: new Date(),
      })
      .where(and(eq(expenses.id, id), eq(expenses.schoolId, session.schoolId)))
      .returning();

    return NextResponse.json(normalizeExpenseMedia(updatedExpense));

  } catch (error: any) {
    console.error('Failed to update expense:', error);
    const isValidationError = ['Maximum 5 photos are allowed.', 'Only photo uploads are allowed for project media.'].includes(error.message);
    return NextResponse.json({ error: isValidationError ? error.message : 'Internal Server Error', details: error.message }, { status: isValidationError ? 400 : 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const session = await getSessionFromCookies('SUB_ADMIN');
    if (!session || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Project id is required' }, { status: 400 });
    }

    const existing = await db.query.expenses.findFirst({
      where: and(eq(expenses.id, id), eq(expenses.schoolId, session.schoolId)),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await deleteExpenseMedia(existing.mediaUrl);

    await db.delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.schoolId, session.schoolId)));

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Failed to delete expense:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('SUB_ADMIN');
    if (!session || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string; // 'CONSTRUCTION' or 'EVENT'
    const startDate = formData.get('startDate') as string;
    const estimatedCost = formData.get('estimatedCost') as string;
    const files = formData.getAll('media').filter((item): item is File => item instanceof File && item.size > 0);

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and Type are required' }, { status: 400 });
    }

    // Fetch school name for folder structure using Drizzle
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, session.schoolId),
      columns: { schoolName: true }
    });
    
    const schoolName = school?.schoolName || 'UnknownSchool';
    const folderPath = `${schoolName}/construction-event-cost`;

    let mediaUrl = null;
    let mediaType = null;

    if (files.length > 0) {
      const urls = await uploadProjectPhotos(files, folderPath);
      mediaUrl = JSON.stringify(urls);
      mediaType = 'IMAGE';
    }

    const [newExpense] = await db.insert(expenses).values({
      title,
      description: description || null,
      type,
      startDate: startDate ? startDate : null, // Drizzle date column usually takes string 'YYYY-MM-DD'
      estimatedCost: estimatedCost || '0',
      mediaUrl,
      mediaType,
      schoolId: session.schoolId
    }).returning();

    await createNotification({
      title: 'New fundraising cost added',
      message: `${title} was added for ${schoolName}.`,
      type: 'MONITORING',
      priority: 'NORMAL',
      actorRole: 'SUB_ADMIN',
      actorId: session.userId,
      schoolId: session.schoolId,
      entityType: 'Expense',
      entityId: newExpense.id,
      link: '/superadmin/dashboard',
      audiences: [{ type: 'ROLE', recipientRole: 'SUPER_ADMIN' }],
    });

    await logActivity({
      schoolId: session.schoolId,
      actorRole: 'SUB_ADMIN',
      actorId: session.userId,
      actorEmail: session.email,
      category: 'PROJECT',
      action: 'PROJECT_CREATED',
      title: 'New fundraising cost added',
      message: `${title} was added for ${schoolName}.`,
      status: 'SUCCESS',
      entityType: 'Expense',
      entityId: newExpense.id,
      link: '/subadmin/accounts?tab=projects',
    });

    return NextResponse.json(normalizeExpenseMedia(newExpense));

  } catch (error: any) {
    console.error('Failed to create expense:', error);
    const isValidationError = ['Maximum 5 photos are allowed.', 'Only photo uploads are allowed for project media.'].includes(error.message);
    return NextResponse.json({ error: isValidationError ? error.message : 'Internal Server Error', details: error.message }, { status: isValidationError ? 400 : 500 });
  }
}
