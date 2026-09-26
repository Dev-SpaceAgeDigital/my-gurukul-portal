const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_nJkM2R3sTLYZ@ep-divine-violet-a8eijyl3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function seedAlumniVoices() {
  try {
    console.log('Fetching existing schools...');
    const schoolsRes = await pool.query('SELECT id, "schoolName" FROM "School" LIMIT 5');
    const school1 = schoolsRes.rows[0]?.id || null;
    const school2 = schoolsRes.rows[1]?.id || school1;

    const sampleAlumni = [
      {
        name: 'Farhana Sheikh',
        email: 'farhana.sheikh@alumni.madni.org',
        password: '$2a$10$hashedpasswordplaceholder',
        batchYear: '2019',
        schoolId: school1, // Sabri High School
        currentTitle: 'Software Engineer at TechVision',
        currentBio: 'I came from a family that could not afford fees. Zakat & Trust scholarship funded my entire schooling at Sabri High School. Today, I work as a Software Engineer and contribute back to educate 10 more children every year.',
        profilePic: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
        linkedIn: 'https://linkedin.com',
      },
      {
        name: 'Sana Vohra',
        email: 'sana.vohra@alumni.madni.org',
        password: '$2a$10$hashedpasswordplaceholder',
        batchYear: '2020',
        schoolId: school2, // Markaz Public School
        currentTitle: 'B.Ed Student & Aspiring Educator',
        currentBio: 'My teachers at Markaz Public School inspired me so much that I decided to dedicate my career to teaching. I am currently completing my B.Ed to teach science in Gujarati medium schools.',
        profilePic: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
        linkedIn: 'https://linkedin.com',
      },
      {
        name: 'Mohsin Mansuri',
        email: 'mohsin.mansuri@alumni.madni.org',
        password: '$2a$10$hashedpasswordplaceholder',
        batchYear: '2018',
        schoolId: school1, // Sabri High School
        currentTitle: 'Civil Engineer & Site Manager',
        currentBio: 'The discipline, faith, and technical foundation I gained at Sabri High School helped me clear my Diploma & Degree in Civil Engineering. Proud to mentor current students.',
        profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        linkedIn: 'https://linkedin.com',
      }
    ];

    for (const a of sampleAlumni) {
      await pool.query(`
        INSERT INTO "Alumni" ("id", "name", "email", "password", "batchYear", "schoolId", "currentTitle", "currentBio", "profilePic", "linkedIn", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT ("email") DO UPDATE SET
          "currentTitle" = EXCLUDED."currentTitle",
          "currentBio" = EXCLUDED."currentBio",
          "batchYear" = EXCLUDED."batchYear",
          "profilePic" = EXCLUDED."profilePic";
      `, [a.name, a.email, a.password, a.batchYear, a.schoolId, a.currentTitle, a.currentBio, a.profilePic, a.linkedIn]);
    }

    console.log('Successfully seeded rich Alumni Voices into PostgreSQL database!');
  } catch (err) {
    console.error('Error seeding alumni voices:', err);
  } finally {
    await pool.end();
  }
}

seedAlumniVoices();
