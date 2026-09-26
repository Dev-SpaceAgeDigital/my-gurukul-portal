import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const { uploadMedia } = await import('@/lib/storage');
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult: any = await uploadMedia(buffer, file.name, `public/school-page/${session.schoolId}`, true);

    return NextResponse.json({
      url: uploadResult.secure_url,
      fileId: uploadResult.public_id,
    }, { status: 201 });
  } catch (error) {
    console.error('School page media upload error:', error);
    return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 });
  }
}
