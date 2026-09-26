const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_nJkM2R3sTLYZ@ep-divine-violet-a8eijyl3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function seedMentorships() {
  try {
    console.log('Fetching existing schools and alumni for mentorship seed...');
    const schoolsRes = await pool.query('SELECT id, "schoolName" FROM "School" LIMIT 5');
    const alumniRes = await pool.query('SELECT id, name, "currentTitle", "batchYear" FROM "Alumni" LIMIT 5');

    const school1 = schoolsRes.rows[0]?.id || null;
    const school2 = schoolsRes.rows[1]?.id || school1;
    const alumni1 = alumniRes.rows[0]?.id || null;
    const alumni2 = alumniRes.rows[1]?.id || alumni1;

    const sampleMentorships = [
      {
        alumniId: alumni1,
        schoolId: school1, // Sabri High School
        title: 'Career & Higher Education Guidance',
        description: 'Monthly 1-on-1 career guidance sessions for Std. 10–12 students discussing Engineering, Science, and vocational career paths.',
        targetStudent: 'Std 10 to 12 Students',
        availability: '2 Hours / Month (Weekends)',
        category: 'Career Mentorship',
        status: 'APPROVED',
      },
      {
        alumniId: alumni2,
        schoolId: school2, // Markaz Public School
        title: 'Spoken English & Communication Skills Workshop',
        description: 'Interactive weekend mentorship sessions helping middle school students build confidence in spoken English and public speaking.',
        targetStudent: 'Std 6 to 9 Students',
        availability: '1 Hour / Week (Saturdays)',
        category: 'Skill Building',
        status: 'APPROVED',
      },
      {
        alumniId: alumni1,
        schoolId: null, // Approved for All Schools!
        title: 'IT & Digital Literacy Mentorship (All Schools)',
        description: 'Teaching foundational computer skills, safe internet practices, and basic coding logic to high school students across all trust schools.',
        targetStudent: 'Std 8 to 12 Students (All Schools)',
        availability: 'Flexible Weekend Sessions',
        category: 'Technical Mentorship',
        status: 'APPROVED',
      }
    ];

    for (const item of sampleMentorships) {
      await pool.query(`
        INSERT INTO "MentorshipOffer" ("id", "alumniId", "schoolId", "title", "description", "targetStudent", "availability", "category", "status", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [item.alumniId, item.schoolId, item.title, item.description, item.targetStudent, item.availability, item.category, item.status]);
    }

    console.log('Successfully seeded approved Mentorship Offers into PostgreSQL!');
  } catch (err) {
    console.error('Error seeding mentorships:', err);
  } finally {
    await pool.end();
  }
}

seedMentorships();
