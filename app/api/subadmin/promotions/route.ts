import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { studentEnrollments, students, standards } from '@/lib/db/schema';
import { getSessionFromCookies } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/monitoring';
import { eq, inArray, and } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      studentIds, 
      targetStandardId, 
      academicYearId, 
      status, 
      currentAcademicYearId,
      toppers,
      otherPercentages
    } = await request.json();

    if (!studentIds || !studentIds.length || !academicYearId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Security check: Ensure target standard belongs to this school
    const targetStandard = await db.query.standards.findFirst({
        where: and(
            eq(standards.id, targetStandardId),
            eq(standards.schoolId, session.schoolId)
        )
    });

    if (!targetStandard && status !== 'DROPPED') {
        return NextResponse.json({ error: 'Invalid target standard for this school' }, { status: 403 });
    }

    await db.transaction(async (tx) => {
      // 1. Update status of old enrollments
      if (currentAcademicYearId) {
        await tx.update(studentEnrollments)
          .set({ status: status })
          .where(
            and(
              inArray(studentEnrollments.studentId, studentIds),
              eq(studentEnrollments.academicYearId, currentAcademicYearId)
            )
          );
          
        // Update ranks and percentages for toppers
        if (toppers && Array.isArray(toppers)) {
          for (const topper of toppers) {
            await tx.update(studentEnrollments)
              .set({ rank: topper.rank, percentage: topper.percentage ? topper.percentage.toString() : null })
              .where(
                and(
                  eq(studentEnrollments.studentId, topper.studentId),
                  eq(studentEnrollments.academicYearId, currentAcademicYearId)
                )
              );
          }
        }

        // Update percentages for non-toppers
        if (otherPercentages && Array.isArray(otherPercentages)) {
          for (const item of otherPercentages) {
            await tx.update(studentEnrollments)
              .set({ percentage: item.percentage ? item.percentage.toString() : null })
              .where(
                and(
                  eq(studentEnrollments.studentId, item.studentId),
                  eq(studentEnrollments.academicYearId, currentAcademicYearId)
                )
              );
          }
        }
      }

      // 2. Create new enrollment records (unless they dropped or graduated)
      if (status === 'PROMOTED' || status === 'REPEATING') {
        const enrollmentValues = studentIds.map((studentId: string) => ({
          studentId,
          standardId: targetStandardId,
          academicYearId,
          status: 'ACTIVE',
        }));

        await tx.insert(studentEnrollments).values(enrollmentValues);

        // 3. Update the Student record's current state
        await tx.update(students)
          .set({ 
            standardId: targetStandardId,
            currentClass: targetStandard?.standardName || null,
            updatedAt: new Date()
          })
          .where(inArray(students.id, studentIds));
      } else if (status === 'GRADUATED' || status === 'DROPPED') {
        // Clear their current standard mapping so they don't appear in active student lists
        await tx.update(students)
          .set({ 
            standardId: null,
            currentClass: null,
            updatedAt: new Date()
          })
          .where(inArray(students.id, studentIds));
      }
    });

    await createNotification({
      title: 'Student promotion processed',
      message: `${studentIds.length} student records were processed with ${status}.`,
      type: 'MONITORING',
      priority: 'NORMAL',
      actorRole: 'SUB_ADMIN',
      actorId: session.userId,
      schoolId: session.schoolId,
      entityType: 'StudentPromotion',
      entityId: academicYearId,
      link: '/superadmin/students',
      audiences: [{ type: 'ROLE', recipientRole: 'SUPER_ADMIN' }],
    });

    await logActivity({
      schoolId: session.schoolId,
      actorRole: 'SUB_ADMIN',
      actorId: session.userId,
      actorEmail: session.email,
      category: 'PROMOTION',
      action: 'STUDENT_PROMOTION_PROCESSED',
      title: 'Student promotion processed',
      message: `${studentIds.length} student records were processed with ${status}.`,
      status: 'SUCCESS',
      entityType: 'StudentPromotion',
      entityId: academicYearId,
      link: '/subadmin/promotion',
    });

    return NextResponse.json({ success: true, message: `Processed ${studentIds.length} students` });
  } catch (error) {
    console.error('Subadmin promotion error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
