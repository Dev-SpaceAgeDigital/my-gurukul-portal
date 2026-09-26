import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { studentEnrollments, students, standards } from '@/lib/db/schema';
import { getSessionFromCookies } from '@/lib/auth';
import { eq, inArray } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { 
      studentIds, 
      targetStandardId, 
      academicYearId, 
      status, // PROMOTED, REPEATING, DROPPED
      currentAcademicYearId 
    } = await request.json();

    if (!studentIds || !studentIds.length || !academicYearId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use a transaction for consistency
    await db.transaction(async (tx) => {
      // 1. Update status of old enrollments if currentAcademicYearId is provided
      if (currentAcademicYearId) {
        await tx.update(studentEnrollments)
          .set({ status: status })
          .where(
            inArray(studentEnrollments.studentId, studentIds)
          );
      }

      // 2. Create new enrollment records for PROMOTED or REPEATING
      if (status === 'PROMOTED' || status === 'REPEATING') {
        const enrollmentValues = studentIds.map((studentId: string) => ({
          studentId,
          standardId: targetStandardId,
          academicYearId,
          status: 'ACTIVE',
        }));

        await tx.insert(studentEnrollments).values(enrollmentValues);

        // Fetch target standard name to sync currentClass
        const sRecord = await tx.query.standards.findFirst({
          where: eq(standards.id, targetStandardId)
        });

        // 3. Update the Student record's current state (Backup compatibility)
        await tx.update(students)
          .set({ 
            standardId: targetStandardId,
            currentClass: sRecord?.standardName || null,
            updatedAt: new Date()
          })
          .where(inArray(students.id, studentIds));
      } else if (status === 'DROPPED') {
          // If dropped, maybe mark student as inactive or just update status in enrollment
          // For now, we just don't create a new enrollment
      }
    });

    return NextResponse.json({ success: true, message: `Processed ${studentIds.length} students` });
  } catch (error) {
    console.error('Promotion error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
