import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { blogs, alumni } from '@/lib/db/schema';
import { getSessionFromCookies } from '@/lib/auth';
import { uploadMedia } from '@/lib/storage';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/monitoring';
import { eq, desc } from 'drizzle-orm';

import { validateUploadFiles } from '@/lib/fileValidation';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies('ALUMNI');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userBlogs = await db.query.blogs.findMany({
      where: eq(blogs.alumniId, session.userId),
      orderBy: [desc(blogs.createdAt)],
    });

    return NextResponse.json(userBlogs);
  } catch (error) {
    console.error('Blogs fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('ALUMNI');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const mediaType = (formData.get('mediaType') as string) || 'IMAGE';
    const tags = formData.get('tags') ? (formData.get('tags') as string).split(',').map(t => t.trim()) : [];
    
    if (!title || !content) {
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
          const uploadResult = await uploadMedia(buffer, file.name, 'alumni/blogs', true);
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
        const uploadResult = await uploadMedia(buffer, rawFile.name, 'alumni/blogs', false);
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
        const uploadResult = await uploadMedia(buffer, rawFile.name, 'alumni/blogs', false, 'application/pdf');
        mediaUrl = uploadResult.secure_url;
      }
    }

    const [newBlog] = await db.insert(blogs).values({
      alumniId: session.userId,
      schoolId: alumniRecord.schoolId,
      title,
      content,
      tags,
      mediaUrl: mediaUrl || null,
      mediaType,
      status: 'PENDING',
    }).returning();

    await createNotification({
      title: 'New alumni blog submitted',
      message: `${title} is waiting for moderation.`,
      type: 'CONTENT',
      priority: 'NORMAL',
      actorRole: 'ALUMNI',
      actorId: session.userId,
      schoolId: alumniRecord.schoolId,
      entityType: 'Blog',
      entityId: newBlog.id,
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
      category: 'BLOG',
      action: 'BLOG_SUBMITTED',
      title,
      message: 'Blog submitted for moderation.',
      status: 'PENDING',
      entityType: 'Blog',
      entityId: newBlog.id,
      link: '/subadmin/alumni',
    });

    return NextResponse.json(newBlog);
  } catch (error) {
    console.error('Blog creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
