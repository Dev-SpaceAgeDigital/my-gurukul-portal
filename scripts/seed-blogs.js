const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_nJkM2R3sTLYZ@ep-divine-violet-a8eijyl3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function seedBlogs() {
  try {
    console.log('Fetching existing schools and alumni for blog seed...');
    const schoolsRes = await pool.query('SELECT id, "schoolName" FROM "School" LIMIT 5');
    const alumniRes = await pool.query('SELECT id, name, "currentTitle", "batchYear" FROM "Alumni" LIMIT 5');

    const school1 = schoolsRes.rows[0]?.id || null;
    const school2 = schoolsRes.rows[1]?.id || school1;
    const alumni1 = alumniRes.rows[0]?.id || null;
    const alumni2 = alumniRes.rows[1]?.id || alumni1;

    const sampleBlogs = [
      {
        alumniId: alumni1,
        schoolId: school1,
        title: 'Why Mother-Tongue Gujarati Education Still Matters in 2025',
        content: 'In a world racing toward English fluency, the value of mother-tongue education is often overlooked. Foundational learning in Gujarati builds deeper cognitive understanding, confidence, and cultural root connection for our students.',
        tags: ['Education Guides', 'Education'],
        mediaUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=600',
        mediaType: 'IMAGE',
        status: 'APPROVED',
        isFeatured: true,
      },
      {
        alumniId: alumni2,
        schoolId: school2,
        title: 'From Sabri High School to Software Engineering: My Journey',
        content: 'I never imagined I would be working at a tech company. Sabri High School did not just teach me mathematics — it taught me perseverance and self-belief.',
        tags: ['Alumni Stories', 'Alumni'],
        mediaUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=600',
        mediaType: 'IMAGE',
        status: 'APPROVED',
        isFeatured: false,
      },
      {
        alumniId: alumni1,
        schoolId: school1,
        title: 'Sabri High School Achieves 97.9% SSC Pass Rate in GSEB Board Exams',
        content: 'We are proud to announce that Sabri High School students achieved an outstanding 97.9% pass rate in the 2024 GSEB board examinations, with 12 toppers securing A1 grades.',
        tags: ['School News', 'Achievement'],
        mediaUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600',
        mediaType: 'IMAGE',
        status: 'APPROVED',
        isFeatured: false,
      },
      {
        alumniId: alumni2,
        schoolId: school2,
        title: 'Effective Science Study Habits for Std 9 & 10 GSEB Students',
        content: 'After 10 years of teaching high school science, I have identified 5 core study habits that separate students who excel from those who struggle. Daily concept recap and diagram practice make all the difference.',
        tags: ['Teacher Writes', 'Guide'],
        mediaUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600',
        mediaType: 'IMAGE',
        status: 'APPROVED',
        isFeatured: false,
      },
      {
        alumniId: alumni1,
        schoolId: school1,
        title: 'My Experience Writing for the School Magazine: Student Voice',
        content: 'Writing my first essay for the annual magazine was scary. But with guidance from my teachers, I discovered my love for journalism and creative writing.',
        tags: ['Student Voice', 'Student'],
        mediaUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=600',
        mediaType: 'IMAGE',
        status: 'APPROVED',
        isFeatured: false,
      }
    ];

    for (const b of sampleBlogs) {
      await pool.query(`
        INSERT INTO "Blog" ("id", "alumniId", "schoolId", "title", "content", "tags", "mediaUrl", "mediaType", "status", "isFeatured", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `, [b.alumniId, b.schoolId, b.title, b.content, b.tags, b.mediaUrl, b.mediaType, b.status, b.isFeatured]);
    }

    console.log('Successfully seeded approved Blogs & Articles into PostgreSQL database!');
  } catch (err) {
    console.error('Error seeding blogs:', err);
  } finally {
    await pool.end();
  }
}

seedBlogs();
