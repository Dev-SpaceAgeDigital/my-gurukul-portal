const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_nJkM2R3sTLYZ@ep-divine-violet-a8eijyl3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function seedCareers() {
  try {
    console.log('Fetching existing schools and alumni...');
    const schoolsRes = await pool.query('SELECT id, "schoolName" FROM "School" LIMIT 5');
    const alumniRes = await pool.query('SELECT id, name, "currentTitle", "batchYear" FROM "Alumni" LIMIT 5');

    const school1 = schoolsRes.rows[0]?.id || null;
    const school2 = schoolsRes.rows[1]?.id || school1;
    const alumni1 = alumniRes.rows[0]?.id || null;
    const alumni2 = alumniRes.rows[1]?.id || alumni1;

    console.log('Found School IDs:', { school1, school2 });
    console.log('Found Alumni IDs:', { alumni1, alumni2 });

    const sampleCareers = [
      {
        alumniId: alumni1,
        schoolId: school1,
        type: 'JOB',
        companyName: 'Sabri High School',
        companyLink: 'https://madnieducation.org',
        role: 'Senior Mathematics Teacher — Std 9-10',
        relation: 'Direct School Hiring',
        description: 'Sabri High School is seeking an experienced GSEB Mathematics teacher. Must have B.Sc + B.Ed degree and 2+ years of teaching experience.',
        category: 'Teaching',
        status: 'APPROVED',
      },
      {
        alumniId: alumni2,
        schoolId: school2,
        type: 'JOB',
        companyName: 'TechVision Solutions (Alumni Referral)',
        companyLink: 'https://linkedin.com',
        role: 'Junior Frontend Developer (React / Next.js)',
        relation: 'Alumni Company Referral',
        description: 'Exciting referral opportunity at TechVision Solutions for Madni Education Trust alumni & graduates interested in Web Development.',
        category: 'Technical',
        status: 'APPROVED',
      },
      {
        alumniId: alumni1,
        schoolId: school1,
        type: 'JOB',
        companyName: 'Markaz Public School',
        companyLink: 'https://madnieducation.org',
        role: 'School Administrative Assistant & Records Coordinator',
        relation: 'Trust Administrative Role',
        description: 'Managing admissions paperwork, student GR records, parent communication, and daily administrative operations.',
        category: 'Administration',
        status: 'APPROVED',
      }
    ];

    for (const item of sampleCareers) {
      await pool.query(`
        INSERT INTO "CareerOpportunity" ("id", "alumniId", "schoolId", "type", "companyName", "companyLink", "role", "relation", "description", "category", "status", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `, [item.alumniId, item.schoolId, item.type, item.companyName, item.companyLink, item.role, item.relation, item.description, item.category, item.status]);
    }

    console.log('Successfully seeded approved Career Opportunities into PostgreSQL!');
  } catch (err) {
    console.error('Error seeding careers:', err);
  } finally {
    await pool.end();
  }
}

seedCareers();
