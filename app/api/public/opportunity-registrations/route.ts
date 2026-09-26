import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createNotification } from '@/lib/notifications';
import { ensureCareerTables } from '@/lib/ensureCareerTables';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const isUuid = (value: unknown) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function POST(request: Request) {
  try {
    await ensureCareerTables();

    const { postType, postId, name, email, phoneNo, linkedInUrl } = await request.json();
    const normalizedPostType = typeof postType === 'string' ? postType.toUpperCase() : '';

    if (!['CAREER', 'MENTORSHIP'].includes(normalizedPostType) || !isUuid(postId)) {
      return NextResponse.json({ error: 'Invalid opportunity' }, { status: 400, headers: corsHeaders });
    }

    if (!name?.trim() || !email?.trim() || !phoneNo?.trim()) {
      return NextResponse.json({ error: 'Name, email, and phone number are required' }, { status: 400, headers: corsHeaders });
    }

    const postResult = normalizedPostType === 'CAREER'
      ? await pool.query(
          'SELECT id, "alumniId" FROM "CareerOpportunity" WHERE id = $1 AND status = $2',
          [postId, 'APPROVED']
        )
      : await pool.query(
          'SELECT id, "alumniId" FROM "MentorshipOffer" WHERE id = $1 AND status = $2',
          [postId, 'APPROVED']
        );

    const post = postResult.rows[0];
    if (!post) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404, headers: corsHeaders });
    }

    const result = await pool.query(
      `INSERT INTO "OpportunityRegistration"
        ("postType", "postId", "alumniId", "name", "email", "phoneNo", "linkedInUrl")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, "createdAt"`,
      [
        normalizedPostType,
        postId,
        post.alumniId,
        name.trim(),
        email.trim(),
        phoneNo.trim(),
        linkedInUrl?.trim() || null,
      ]
    );

    await createNotification({
      title: 'New opportunity registration',
      message: `${name.trim()} registered interest in your ${normalizedPostType.toLowerCase()} post.`,
      type: 'ACTION',
      priority: 'HIGH',
      entityType: 'OpportunityRegistration',
      entityId: result.rows[0].id,
      link: '/alumni/registrations',
      audiences: [
        { type: 'DIRECT', recipientRole: 'ALUMNI', recipientId: post.alumniId },
        { type: 'ROLE', recipientRole: 'SUPER_ADMIN' },
      ],
    });

    return NextResponse.json({ success: true, registration: result.rows[0] }, { headers: corsHeaders });
  } catch (error) {
    console.error('Public opportunity registration error:', error);
    return NextResponse.json({ error: 'Failed to submit registration' }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
