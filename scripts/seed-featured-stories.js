const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_nJkM2R3sTLYZ@ep-divine-violet-a8eijyl3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function seedFeaturedStories() {
  try {
    console.log('Fetching schools and alumni for featured stories seed...');
    const schoolsRes = await pool.query('SELECT id, "schoolName" FROM "School"');
    const alumniRes = await pool.query('SELECT id, name, "currentTitle", "batchYear", "schoolId" FROM "Alumni"');

    if (schoolsRes.rows.length === 0 || alumniRes.rows.length === 0) {
      console.log('Missing schools or alumni. Cannot seed featured stories.');
      process.exit(1);
    }

    const sabriSchool = schoolsRes.rows.find(s => s.schoolName.includes('Sabri'))?.id || schoolsRes.rows[0].id;
    const markazSchool = schoolsRes.rows.find(s => s.schoolName.includes('Markaz'))?.id || schoolsRes.rows[1]?.id || sabriSchool;

    const alumnus1 = alumniRes.rows[0].id;
    const alumnus2 = alumniRes.rows[1]?.id || alumnus1;
    const alumnus3 = alumniRes.rows[2]?.id || alumnus1;

    // Seed top featured and featured blogs
    const sampleFeaturedBlogs = [
      {
        alumniId: alumnus1,
        schoolId: sabriSchool,
        title: 'Madni Education Gave Me the Ladder When I Couldn\'t See the Sky',
        content: 'Enrolled at Sabri High School with a full subsidy in 2014 and graduated MBBS in 2024 with distinction. Today I am serving as a Doctor at Surat Civil Hospital.',
        tags: ['Alumni Stories', 'Featured'],
        mediaUrl: 'https://images.unsplash.com/photo-1594824813571-28a77885097a?auto=format&fit=crop&q=80&w=600',
        mediaType: 'IMAGE',
        status: 'APPROVED',
        isFeatured: true,
        isTopFeatured: true, // Selected by SuperAdmin for Homepage Main Banner!
      },
      {
        alumniId: alumnus2,
        schoolId: markazSchool,
        title: 'The Teachers at Markaz Believed in Me Before I Believed in Myself',
        content: 'Started coding in Class 8 on the school\'s donated computers. Secured a full scholarship to Nirma University and joined TCS straight from campus as a Software Engineer.',
        tags: ['Alumni Stories', 'Technology'],
        mediaUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=600',
        mediaType: 'IMAGE',
        status: 'APPROVED',
        isFeatured: true,
        isTopFeatured: false,
      },
    ];

    for (const blog of sampleFeaturedBlogs) {
      await pool.query(
        `INSERT INTO "Blog" ("alumniId", "schoolId", title, content, tags, "mediaUrl", "mediaType", status, "isFeatured", "isTopFeatured", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [
          blog.alumniId,
          blog.schoolId,
          blog.title,
          blog.content,
          blog.tags,
          blog.mediaUrl,
          blog.mediaType,
          blog.status,
          blog.isFeatured,
          blog.isTopFeatured,
        ]
      );
    }

    // Seed featured achievements
    const sampleAchievements = [
      {
        alumniId: alumnus3,
        schoolId: markazSchool,
        title: 'Gujarat State Science Olympiad Winner 2025',
        description: 'Secured 1st rank in the State Science Olympiad 2025 representing Markaz Public School, Karjan — competing against 1,200+ students statewide.',
        category: 'State Level Academic Award',
        mediaUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600',
        mediaType: 'IMAGE',
        status: 'APPROVED',
        isFeatured: true,
      },
    ];

    for (const ach of sampleAchievements) {
      await pool.query(
        `INSERT INTO "Achievement" ("alumniId", "schoolId", title, description, category, "mediaUrl", "mediaType", status, "isFeatured", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [
          ach.alumniId,
          ach.schoolId,
          ach.title,
          ach.description,
          ach.category,
          ach.mediaUrl,
          ach.mediaType,
          ach.status,
          ach.isFeatured,
        ]
      );
    }

    console.log('Successfully seeded featured stories and achievements into PostgreSQL!');
  } catch (error) {
    console.error('Error seeding featured stories:', error);
  } finally {
    await pool.end();
  }
}

seedFeaturedStories();
