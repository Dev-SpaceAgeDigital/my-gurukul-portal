import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { schools, trusts } from '@/lib/db/schema';
import { getSessionFromCookies } from '@/lib/auth';
import { uploadMedia, deleteMedia } from '@/lib/storage';
import { eq, desc } from 'drizzle-orm';

// GET all schools (with Trust name)
export async function GET() {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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
  } catch (error) {
    console.error('Fetch schools error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new school
export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    
    const schoolName = formData.get('schoolName') as string;
    const trustId = formData.get('trustId') as string;
    
    if (!schoolName || !trustId) {
      return NextResponse.json({ error: 'School Name and Trust are required' }, { status: 400 });
    }

    // Get Trust name for folder path
    const trust = await db.query.trusts.findFirst({
        where: eq(trusts.id, trustId),
        columns: { trustName: true }
    });
    const folderPath = `${trust?.trustName || 'UnknownTrust'}/${schoolName}`;

    // Handle up to 3 images
    const imageUrls: string[] = [];
    for (let i = 1; i <= 3; i++) {
        const file = formData.get(`image${i}`) as File | null;
        if (file && file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const uploadResult: any = await uploadMedia(buffer, file.name, folderPath, true);
            imageUrls.push(uploadResult.secure_url);
        }
    }

    const [newSchool] = await db.insert(schools).values({
      schoolName,
      trustId,
      address: formData.get('address') as string || null,
      phoneNo: formData.get('phoneNo') as string || null,
      email: formData.get('email') as string || null,
      medium: formData.get('medium') as string || 'English',
      schoolDiseNo: formData.get('schoolDiseNo') as string || null,
      isHaveRTE: formData.get('isHaveRTE') === 'true',
      sscIndexNo: formData.get('sscIndexNo') as string || null,
      hscIndexNo: formData.get('hscIndexNo') as string || null,
      establishYear: parseInt(formData.get('establishYear') as string) || null,
      totalStandards: parseInt(formData.get('totalStandards') as string) || null,
      currentStudentsNo: parseInt(formData.get('currentStudentsNo') as string) || 0,
      imageUrls: imageUrls.length > 0 ? imageUrls : null,
    }).returning();

    return NextResponse.json(newSchool);
  } catch (error: any) {
    console.error('Create school error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A school with this Dise No already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update school
export async function PUT(request: Request) {
    try {
      const session = await getSessionFromCookies('SUPER_ADMIN');
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
  
      const formData = await request.formData();
      const id = formData.get('id') as string;
      const schoolName = formData.get('schoolName') as string;
      const trustId = formData.get('trustId') as string;

      if (!id || !schoolName || !trustId) {
        return NextResponse.json({ error: 'ID, School Name and Trust are required' }, { status: 400 });
      }

      // Fetch current school to manage images
      const currentSchool = await db.query.schools.findFirst({
          where: eq(schools.id, id)
      });
      if (!currentSchool) return NextResponse.json({ error: 'School not found' }, { status: 404 });

      // Get Trust name for folder path
      const trust = await db.query.trusts.findFirst({
          where: eq(trusts.id, trustId),
          columns: { trustName: true }
      });
      const folderPath = `${trust?.trustName || 'UnknownTrust'}/${schoolName}`;

      // Handle image updates
      const currentImages = currentSchool.imageUrls || [];
      const newImages: string[] = [...currentImages];
      
      // Check for deletions or replacements
      // If image1_deleted is true, delete it.
      // If image1 (file) is provided, it's a replacement.
      for (let i = 0; i < 3; i++) {
          const file = formData.get(`image${i+1}`) as File | null;
          const isDeleted = formData.get(`image${i+1}_deleted`) === 'true';

          if (isDeleted || (file && file.size > 0)) {
              // Delete old image if it exists
              if (currentImages[i]) {
                  try {
                      await deleteMedia(currentImages[i]);
                  } catch (e) {
                      console.error('Failed to delete old image:', e);
                  }
                  newImages[i] = ''; // Mark as removed
              }
          }

          if (file && file.size > 0) {
              // Upload new image
              const buffer = Buffer.from(await file.arrayBuffer());
              const uploadResult: any = await uploadMedia(buffer, file.name, folderPath, true);
              newImages[i] = uploadResult.secure_url;
          }
      }

      // Cleanup images array (remove empty strings)
      const finalImages = newImages.filter(url => url !== '');

      const [updatedSchool] = await db.update(schools)
        .set({
            schoolName,
            trustId,
            address: formData.get('address') as string || null,
            phoneNo: formData.get('phoneNo') as string || null,
            email: formData.get('email') as string || null,
            medium: formData.get('medium') as string || 'English',
            schoolDiseNo: formData.get('schoolDiseNo') as string || null,
            isHaveRTE: formData.get('isHaveRTE') === 'true',
            sscIndexNo: formData.get('sscIndexNo') as string || null,
            hscIndexNo: formData.get('hscIndexNo') as string || null,
            establishYear: parseInt(formData.get('establishYear') as string) || null,
            totalStandards: parseInt(formData.get('totalStandards') as string) || null,
            currentStudentsNo: parseInt(formData.get('currentStudentsNo') as string) || 0,
            imageUrls: finalImages.length > 0 ? finalImages : null,
            updatedAt: new Date(),
        })
        .where(eq(schools.id, id))
        .returning();
  
      return NextResponse.json(updatedSchool);
    } catch (error: any) {
      console.error('Update school error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE school
export async function DELETE(request: Request) {
    try {
      const session = await getSessionFromCookies('SUPER_ADMIN');
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
  
      const { id } = await request.json();
      if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

      // Fetch school to delete images from Cloudinary
      const school = await db.query.schools.findFirst({
          where: eq(schools.id, id)
      });

      if (school?.imageUrls) {
          for (const url of school.imageUrls) {
              try {
                  await deleteMedia(url);
              } catch (e) {
                  console.error('Failed to delete image on school deletion:', e);
              }
          }
      }
  
      await db.delete(schools).where(eq(schools.id, id));
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Delete school error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
