import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { ensureCareerTables } from '@/lib/ensureCareerTables';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies('ALUMNI');
    if (!session || session.role !== 'ALUMNI') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await ensureCareerTables();

    const { searchParams } = new URL(request.url);
    const peerId = searchParams.get('id') || searchParams.get('alumniId');

    if (!peerId) {
      return NextResponse.json({ error: 'Peer Alumni ID is required' }, { status: 400 });
    }

    // 1. Fetch Alumni Profile Info
    const alumniRes = await pool.query(
      `SELECT 
        a.id, a.name, a."batchYear", a."linkedIn", a."profilePic", 
        a."currentTitle", a."currentBio", a."workLink", a.industry, 
        a.city, a.state, a.country,
        s."schoolName", s."logoUrl" as "schoolLogo", t."logoUrl" as "trustLogo"
       FROM "Alumni" a
       LEFT JOIN "School" s ON a."schoolId" = s.id
       LEFT JOIN "Trust" t ON s."trustId" = t.id
       WHERE a.id = $1`,
      [peerId]
    );

    if (alumniRes.rows.length === 0) {
      return NextResponse.json({ error: 'Alumni not found' }, { status: 404 });
    }

    const alumniData = alumniRes.rows[0];

    // 2. Fetch APPROVED Career Opportunities with live counts (Interested, Referrals, Registrations)
    const careersRes = await pool.query(
      `SELECT 
        c.id, c.type, c."companyName", c."companyLink", c.role, c.description, 
        c.category, c.relation, c.location, c."workMode", c.salary, c.duration, 
        c."experienceLevel", c."applyLink", c.deadline, c."createdAt",
        COALESCE((SELECT COUNT(*)::int FROM "CareerInterest" ci WHERE ci."careerId" = c.id AND ci."interestType" = 'INTERESTED'), 0) as "interestedCount",
        COALESCE((SELECT COUNT(*)::int FROM "CareerInterest" ci WHERE ci."careerId" = c.id AND ci."interestType" = 'REFERRAL_CONTACT'), 0) as "referralCount",
        COALESCE((SELECT COUNT(*)::int FROM "OpportunityRegistration" opr WHERE opr."postId" = c.id AND opr."postType" = 'CAREER'), 0) as "registrationCount"
       FROM "CareerOpportunity" c
       WHERE c."alumniId" = $1 AND c.status = 'APPROVED'
       ORDER BY c."createdAt" DESC`,
      [peerId]
    );

    // 3. Fetch APPROVED Mentorship Offers
    const mentorshipsRes = await pool.query(
      `SELECT 
        m.id, m.title, m.description, m."targetStudent", m.availability, m.category,
        m.format, m."deliveryMode", m."meetingLink", m."sessionDate", m."sessionTime", m.frequency,
        m."createdAt",
        COALESCE((SELECT COUNT(*)::int FROM "OpportunityRegistration" opr WHERE opr."postId" = m.id AND opr."postType" = 'MENTORSHIP'), 0) as "registrationCount"
       FROM "MentorshipOffer" m
       WHERE m."alumniId" = $1 AND m.status = 'APPROVED'
       ORDER BY m."createdAt" DESC`,
      [peerId]
    );

    // 4. Fetch APPROVED Blogs
    const blogsRes = await pool.query(
      `SELECT id, title, content, tags, "mediaUrl", "mediaType", "isFeatured", "createdAt"
       FROM "Blog"
       WHERE "alumniId" = $1 AND status = 'APPROVED'
       ORDER BY "createdAt" DESC`,
      [peerId]
    );

    // 5. Fetch APPROVED Achievements
    const achievementsRes = await pool.query(
      `SELECT id, title, description, date, category, "mediaUrl", "mediaType", "isFeatured", "createdAt"
       FROM "Achievement"
       WHERE "alumniId" = $1 AND status = 'APPROVED'
       ORDER BY "createdAt" DESC`,
      [peerId]
    );

    const careers = careersRes.rows;
    const mentorships = mentorshipsRes.rows;
    const blogs = blogsRes.rows;
    const achievements = achievementsRes.rows;

    const totalPosts = careers.length + mentorships.length + blogs.length + achievements.length;

    return NextResponse.json({
      success: true,
      alumni: {
        ...alumniData,
        logoUrl: alumniData.schoolLogo || alumniData.trustLogo || '/my-gurukul.png'
      },
      stats: {
        totalPosts,
        totalCareers: careers.length,
        totalMentorships: mentorships.length,
        totalBlogs: blogs.length,
        totalAchievements: achievements.length,
      },
      posts: {
        careers,
        mentorships,
        blogs,
        achievements,
      }
    });

  } catch (error) {
    console.error('Peer profile fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
