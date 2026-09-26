const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_nJkM2R3sTLYZ@ep-divine-violet-a8eijyl3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function seedInternships() {
  try {
    console.log('Fetching existing schools and alumni for internship seed...');
    const schoolsRes = await pool.query('SELECT id, "schoolName" FROM "School" LIMIT 5');
    const alumniRes = await pool.query('SELECT id, name, "currentTitle", "batchYear" FROM "Alumni" LIMIT 5');

    const school1 = schoolsRes.rows[0]?.id || null;
    const school2 = schoolsRes.rows[1]?.id || school1;
    const alumni1 = alumniRes.rows[0]?.id || null;
    const alumni2 = alumniRes.rows[1]?.id || alumni1;

    const sampleInternships = [
      {
        alumniId: alumni1,
        schoolId: school1,
        type: 'INTERNSHIP',
        companyName: 'Sabri High School',
        companyLink: 'https://madnieducation.org',
        role: 'Teaching & Mentorship Intern',
        relation: 'Education & B.Ed Candidates',
        description: 'Gain hands-on teaching experience assisting senior faculty in classroom management, assignment evaluation, and student mentoring.',
        category: 'Teaching',
        status: 'APPROVED',
      },
      {
        alumniId: alumni2,
        schoolId: school2,
        type: 'INTERNSHIP',
        companyName: 'Madni Education Trust',
        companyLink: 'https://madnieducation.org',
        role: 'Digital Media & Graphic Design Intern',
        relation: 'Media & Design Students',
        description: 'Design school posters, document annual day cultural events, and curate social media content for Madni Education Trust schools.',
        category: 'Media & Design',
        status: 'APPROVED',
      },
      {
        alumniId: alumni1,
        schoolId: school1,
        type: 'INTERNSHIP',
        companyName: 'Both Schools',
        companyLink: 'https://madnieducation.org',
        role: 'Community Outreach & Social Work Intern',
        relation: 'Social Work & Management Students',
        description: 'Organize community health drives, donor connection campaigns, and student welfare awareness programs in Karjan.',
        category: 'Social Work',
        status: 'APPROVED',
      }
    ];

    for (const item of sampleInternships) {
      await pool.query(`
        INSERT INTO "CareerOpportunity" ("id", "alumniId", "schoolId", "type", "companyName", "companyLink", "role", "relation", "description", "category", "status", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `, [item.alumniId, item.schoolId, item.type, item.companyName, item.companyLink, item.role, item.relation, item.description, item.category, item.status]);
    }

    console.log('Successfully seeded approved Internships into PostgreSQL!');
  } catch (err) {
    console.error('Error seeding internships:', err);
  } finally {
    await pool.end();
  }
}

seedInternships();
