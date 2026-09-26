import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/monitoring';
import { ensureSchoolPageColumns } from '@/lib/ensureSchoolPageColumns';

const emptyContent = {
  tagline: '',
  aboutTitle: '',
  aboutDescription: '',
  aboutHighlights: [],
  academicPrograms: [],
  facilities: [],
  activityCategories: [],
  teachers: [],
  admissionInfo: {},
  donationInfo: {},
};

function ensureArray(value: any) {
  return Array.isArray(value) ? value : [];
}

function cleanAcademicPrograms(value: any) {
  return ensureArray(value).map((program) => ({
    id: program.id,
    category: program.category || 'Academic Program',
    description: program.description || '',
    standardIds: ensureArray(program.standardIds),
    streams: ensureArray(program.streams),
    subjects: ensureArray(program.subjects),
    curriculumRows: ensureArray(program.curriculumRows),
  }));
}

function cleanFacilities(value: any) {
  return ensureArray(value).map((facility) => ({
    id: facility.id,
    icon: facility.icon || 'building',
    name: facility.name || '',
    detail: facility.detail || '',
    imageUrl: facility.imageUrl || '',
    imageFileId: facility.imageFileId || '',
  }));
}

function cleanTeachers(value: any) {
  return ensureArray(value).map((teacher) => ({
    id: teacher.id,
    name: teacher.name || '',
    designation: teacher.designation || '',
    qualification: teacher.qualification || '',
    experience: teacher.experience || '',
    subjects: ensureArray(teacher.subjects),
    standardIds: ensureArray(teacher.standardIds),
  }));
}

export async function GET() {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureSchoolPageColumns();

    const [contentRes, standardsRes, schoolRes] = await Promise.all([
      pool.query('SELECT * FROM "SchoolPageContent" WHERE "schoolId" = $1 LIMIT 1', [session.schoolId]),
      pool.query('SELECT id, "standardName", division, stream, fees, "batchYear" FROM "Standard" WHERE "schoolId" = $1 ORDER BY "standardName" ASC, division ASC', [session.schoolId]),
      pool.query(`
        SELECT
          s.id,
          s."schoolName",
          s.medium,
          s.email,
          s."phoneNo",
          s."currentStudentsNo",
          s."schoolDiseNo",
          s."sscIndexNo",
          s."hscIndexNo",
          s."establishYear",
          t."trustName"
        FROM "School" s
        LEFT JOIN "Trust" t ON s."trustId" = t.id
        WHERE s.id = $1
        LIMIT 1
      `, [session.schoolId]),
    ]);

    return NextResponse.json({
      school: schoolRes.rows[0] || null,
      standards: standardsRes.rows,
      content: contentRes.rows[0] || { schoolId: session.schoolId, ...emptyContent },
    });
  } catch (error: any) {
    if (error?.code === '42P01') {
      return NextResponse.json({ error: 'School page table is not migrated yet' }, { status: 503 });
    }
    console.error('School page fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureSchoolPageColumns();

    const body = await request.json();
    const content = {
      ...emptyContent,
      ...body,
      aboutHighlights: ensureArray(body.aboutHighlights),
      academicPrograms: cleanAcademicPrograms(body.academicPrograms),
      facilities: cleanFacilities(body.facilities),
      activityCategories: ensureArray(body.activityCategories),
      teachers: cleanTeachers(body.teachers),
      admissionInfo: body.admissionInfo && typeof body.admissionInfo === 'object' ? body.admissionInfo : {},
      donationInfo: body.donationInfo && typeof body.donationInfo === 'object' ? body.donationInfo : {},
    };

    // Check if session.userId exists in User table for FK constraint
    let validUserId = null;
    if (session.userId) {
      try {
        const userCheck = await pool.query('SELECT id FROM "User" WHERE id = $1', [session.userId]);
        if (userCheck.rows.length > 0) validUserId = session.userId;
      } catch (_) {}
    }

    const result = await pool.query(`
      INSERT INTO "SchoolPageContent" (
        "schoolId", "tagline", "aboutTitle", "aboutDescription", "aboutHighlights",
        "academicPrograms", "facilities", "activityCategories", "teachers",
        "admissionInfo", "donationInfo", "updatedBy", "createdAt", "updatedAt"
      )
      VALUES ($1,$2,$3,$4,$5::text[],$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12,NOW(),NOW())
      ON CONFLICT ("schoolId") DO UPDATE SET
        "tagline" = EXCLUDED."tagline",
        "aboutTitle" = EXCLUDED."aboutTitle",
        "aboutDescription" = EXCLUDED."aboutDescription",
        "aboutHighlights" = EXCLUDED."aboutHighlights",
        "academicPrograms" = EXCLUDED."academicPrograms",
        "facilities" = EXCLUDED."facilities",
        "activityCategories" = EXCLUDED."activityCategories",
        "teachers" = EXCLUDED."teachers",
        "admissionInfo" = EXCLUDED."admissionInfo",
        "donationInfo" = EXCLUDED."donationInfo",
        "updatedBy" = EXCLUDED."updatedBy",
        "updatedAt" = NOW()
      RETURNING *
    `, [
      session.schoolId,
      content.tagline || null,
      content.aboutTitle || null,
      content.aboutDescription || null,
      content.aboutHighlights,
      JSON.stringify(content.academicPrograms),
      JSON.stringify(content.facilities),
      JSON.stringify(content.activityCategories),
      JSON.stringify(content.teachers),
      JSON.stringify(content.admissionInfo),
      JSON.stringify(content.donationInfo),
      validUserId,
    ]);

    try {
      await createNotification({
        title: 'School page updated',
        message: 'A subadmin updated public school page content.',
        type: 'MONITORING',
        priority: 'NORMAL',
        actorRole: 'SUB_ADMIN',
        actorId: session.userId,
        schoolId: session.schoolId,
        entityType: 'SchoolPageContent',
        entityId: session.schoolId,
      link: '/superadmin/school',
        audiences: [{ type: 'ROLE', recipientRole: 'SUPER_ADMIN' }],
      });
      await logActivity({
        schoolId: session.schoolId,
        actorRole: 'SUB_ADMIN',
        actorId: session.userId,
        actorEmail: session.email,
        category: 'SCHOOL_PAGE',
        action: 'SCHOOL_PAGE_UPDATED',
        title: 'School page updated',
        message: 'Public school page content was updated.',
        status: 'SUCCESS',
        entityType: 'SchoolPageContent',
        entityId: session.schoolId,
        link: '/subadmin/school-hub?tab=school-page',
      });
    } catch (_) {}

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('School page save error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to save school page' }, { status: 500 });
  }
}
