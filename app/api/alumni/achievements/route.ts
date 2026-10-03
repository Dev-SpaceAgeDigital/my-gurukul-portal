import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { achievements, alumni } from '@/lib/db/schema';
import { getSessionFromCookies } from '@/lib/auth';
import { uploadMedia } from '@/lib/storage';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/monitoring';
import { eq, desc } from 'drizzle-orm';

import { validateUploadFiles, UPLOAD_LIMITS } from '@/lib/fileValidation';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies('ALUMNI');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userAchievements = await db.query.achievements.findMany({
      where: eq(achievements.alumniId, session.userId),
      orderBy: [desc(achievements.createdAt)],
    });

    return NextResponse.json(userAchievements);
  } catch (error) {
    console.error('Achievements fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('ALUMNI');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const category = formData.get('category') as string;
    const mediaType = (formData.get('mediaType') as string) || 'IMAGE';
    
    if (!title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get alumni's schoolId
    const alumniRecord = await db.query.alumni.findFirst({
      where: eq(alumni.id, session.userId),
    });

    if (!alumniRecord?.schoolId) {
      return NextResponse.json({ error: 'Institutional record not found' }, { status: 404 });
    }

    let mediaUrl = '';
    
    // File validation & multi-upload handling
    if (mediaType === 'IMAGE') {
      const rawFiles = formData.getAll('files').length > 0 ? formData.getAll('files') : formData.getAll('file');
      const files = rawFiles.filter((f): f is File => f instanceof File && f.size > 0);

      if (files.length > 0) {
        const validation = validateUploadFiles(files, 'IMAGE');
        if (!validation.isValid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const uploadedUrls: string[] = [];
        for (const file of files.slice(0, 2)) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const uploadResult = await uploadMedia(buffer, file.name, 'alumni/achievements', true);
          uploadedUrls.push(uploadResult.secure_url);
        }
        mediaUrl = uploadedUrls.join(',');
      }
    } else if (mediaType === 'VIDEO') {
      const rawFile = formData.get('file');
      if (rawFile instanceof File && rawFile.size > 0) {
        const validation = validateUploadFiles([rawFile], 'VIDEO');
        if (!validation.isValid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        const bytes = await rawFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadResult = await uploadMedia(buffer, rawFile.name, 'alumni/achievements', false);
        mediaUrl = uploadResult.secure_url;
      } else {
        mediaUrl = (formData.get('mediaUrl') as string) || '';
      }
    } else if (mediaType === 'PDF') {
      const rawFile = formData.get('file');
      if (rawFile instanceof File && rawFile.size > 0) {
        const validation = validateUploadFiles([rawFile], 'PDF');
        if (!validation.isValid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        const bytes = await rawFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadResult = await uploadMedia(buffer, rawFile.name, 'alumni/achievements', false, 'application/pdf');
        mediaUrl = uploadResult.secure_url;
      }
    }

    const [newAchievement] = await db.insert(achievements).values({
      alumniId: session.userId,
      schoolId: alumniRecord.schoolId,
      title,
      description,
      date,
      category,
      mediaUrl: mediaUrl || null,
      mediaType,
      status: 'PENDING',
    }).returning();

    await createNotification({
      title: 'New alumni achievement submitted',
      message: `${title} is waiting for moderation.`,
      type: 'CONTENT',
      priority: 'NORMAL',
      actorRole: 'ALUMNI',
      actorId: session.userId,
      schoolId: alumniRecord.schoolId,
      entityType: 'Achievement',
      entityId: newAchievement.id,
      link: '/subadmin/alumni',
      audiences: [
        { type: 'ROLE', recipientRole: 'SUPER_ADMIN' },
        { type: 'SCHOOL_ROLE', recipientRole: 'SUB_ADMIN', schoolId: alumniRecord.schoolId },
      ],
    });

    await logActivity({
      schoolId: alumniRecord.schoolId,
      actorRole: 'ALUMNI',
      actorId: session.userId,
      actorName: alumniRecord.name,
      actorEmail: alumniRecord.email,
      category: 'ACHIEVEMENT',
      action: 'ACHIEVEMENT_SUBMITTED',
      title,
      message: 'Achievement submitted for moderation.',
      status: 'PENDING',
      entityType: 'Achievement',
      entityId: newAchievement.id,
      link: '/subadmin/alumni',
    });

    return NextResponse.json(newAchievement);
  } catch (error) {
    console.error('Achievement creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
