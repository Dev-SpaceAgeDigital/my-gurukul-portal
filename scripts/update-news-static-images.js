const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_nJkM2R3sTLYZ@ep-divine-violet-a8eijyl3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function updateStaticImages() {
  try {
    console.log('Updating NewsUpdate records in PostgreSQL with static local images...');

    // Clear previous external links and set static images
    await pool.query('DELETE FROM "NewsUpdate"');

    const schoolsRes = await pool.query('SELECT id, "schoolName" FROM "School"');
    const sabriSchool = schoolsRes.rows.find(s => s.schoolName.includes('Sabri'))?.id || null;
    const markazSchool = schoolsRes.rows.find(s => s.schoolName.includes('Markaz'))?.id || null;

    const sampleNews = [
      {
        title: 'Annual Trust Day 2026: 1,200 Voices, One Shared Dream',
        description: 'This year\'s Annual Trust Day brought together students, teachers, donors, and parents across all schools in a celebration of academic excellence and community unity.',
        category: 'Event',
        publishDate: '2026-03-15',
        imageUrl: '/images/img1.jpeg',
        schoolId: null,
        isActive: true,
        createdByRole: 'SUPER_ADMIN',
      },
      {
        title: 'Sabri High School Wins District Science Championship 2026',
        description: 'Our Class 12 team brought home the gold medal at the Vadodara District Science Championship for the second consecutive year.',
        category: 'Achievement',
        publishDate: '2026-02-28',
        imageUrl: '/images/img-101.jpg',
        schoolId: sabriSchool,
        isActive: true,
        createdByRole: 'SUB_ADMIN',
      },
      {
        title: 'Ramadan 2026 Zakat Drive Now Open — Your Giving Changes Lives',
        description: 'As Ramadan approaches, we open our annual Zakat drive with a goal of ₹25 Lakhs to fund the next academic year for 300+ underprivileged children.',
        category: 'Announcement',
        publishDate: '2026-02-10',
        imageUrl: '/images/img-102.jpg.avif',
        schoolId: null,
        isActive: true,
        createdByRole: 'SUPER_ADMIN',
      },
      {
        title: 'Markaz Public School Inaugurates 3,200-Book Digital Library Wing',
        description: 'Thanks to generous donor contributions, Markaz Public School now has a fully equipped computer library and quiet study hall.',
        category: 'School News',
        publishDate: '2026-01-20',
        imageUrl: '/images/img-103.jpg',
        schoolId: markazSchool,
        isActive: true,
        createdByRole: 'SUB_ADMIN',
      },
    ];

    for (const item of sampleNews) {
      await pool.query(
        `INSERT INTO "NewsUpdate" (title, description, category, "publishDate", "imageUrl", "schoolId", "isActive", "createdByRole", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          item.title,
          item.description,
          item.category,
          item.publishDate,
          item.imageUrl,
          item.schoolId,
          item.isActive,
          item.createdByRole,
        ]
      );
    }

    console.log('Successfully updated NewsUpdate records with static local images (/images/img1.jpeg, /images/img-101.jpg, etc.)!');
  } catch (error) {
    console.error('Error updating static images:', error);
  } finally {
    await pool.end();
  }
}

updateStaticImages();
