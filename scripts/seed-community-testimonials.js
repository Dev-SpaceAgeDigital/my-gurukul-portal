require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function seedCommunityTestimonials() {
  try {
    const schoolsRes = await pool.query('SELECT id, "schoolName" FROM "School"');
    console.log(`Found ${schoolsRes.rows.length} schools:`, schoolsRes.rows.map(s => s.schoolName));

    const dummyPassword = '$2a$10$V08ZpU6uVw9mB0T.gJb3ee7yGz3Xw.e1Qv9dG3z1Z.8ZpU6uVw9mB';

    for (const school of schoolsRes.rows) {
      const schoolId = school.id;
      const schoolName = school.schoolName;
      const prefix = schoolName.split(' ')[0];

      const alumniData = [
        {
          name: `Ayesha Patel (${prefix} Alumna)`,
          email: `ayesha.${schoolId.slice(0, 5)}@gmail.com`,
          batchYear: '2018',
          currentTitle: 'Software Engineer at TCS',
          currentBio: `Proud alumnus of ${schoolName}.`,
          quote: `${schoolName} provided me with the moral foundation, disciplined environment, and quality education that paved the way for my career as a software engineer.`,
          title: `Transformation through Education at ${schoolName}`,
        },
        {
          name: `Zaid Vohra (${prefix} Parent & Alumnus)`,
          email: `zaid.${schoolId.slice(0, 5)}@gmail.com`,
          batchYear: '2015',
          currentTitle: 'Parent & Civil Contractor',
          currentBio: `Grateful for the values and discipline taught at ${schoolName}.`,
          quote: `Both my children attend ${schoolName}. The character development, Islamic ethics, and modern GSEB academic focus are second to none in Karjan.`,
          title: `Why We Trust ${schoolName} for Our Children`,
        },
        {
          name: `Dr. Sana Mirza (${prefix} Alumna)`,
          email: `sana.${schoolId.slice(0, 5)}@gmail.com`,
          batchYear: '2016',
          currentTitle: 'Medical Officer & Pediatric Specialist',
          currentBio: `Studied at ${schoolName} with Zakat scholarship aid.`,
          quote: `Coming from a humble background, Madni Trust supported my education with Zakat scholarship. Today I am a doctor serving the community with pride.`,
          title: `From ${schoolName} to Medical Officer`,
        },
      ];

      for (const item of alumniData) {
        const alumniRes = await pool.query(
          `INSERT INTO "Alumni" (id, name, email, password, "batchYear", "currentTitle", "currentBio", "schoolId", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT (email) DO UPDATE SET "currentTitle" = EXCLUDED."currentTitle", "currentBio" = EXCLUDED."currentBio"
           RETURNING id`,
          [item.name, item.email, dummyPassword, item.batchYear, item.currentTitle, item.currentBio, schoolId]
        );

        let alumniId = alumniRes.rows[0]?.id;
        if (!alumniId) {
          const existing = await pool.query(`SELECT id FROM "Alumni" WHERE email = $1 LIMIT 1`, [item.email]);
          alumniId = existing.rows[0]?.id;
        }

        if (alumniId) {
          await pool.query(
            `INSERT INTO "Blog" (id, title, content, status, "isFeatured", "isTopFeatured", "schoolId", "alumniId", "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, $2, 'APPROVED', true, false, $3, $4, NOW(), NOW())
             ON CONFLICT DO NOTHING`,
            [
              item.title,
              item.quote,
              schoolId,
              alumniId,
            ]
          );

          await pool.query(
            `INSERT INTO "Achievement" (id, title, description, category, status, "isFeatured", "schoolId", "alumniId", "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, $2, 'Career Milestone', 'APPROVED', true, $3, $4, NOW(), NOW())
             ON CONFLICT DO NOTHING`,
            [
              `Community Excellence & Achievement`,
              item.quote,
              schoolId,
              alumniId,
            ]
          );
        }
      }
    }

    console.log('Successfully seeded Community Testimonials for all schools in PostgreSQL!');
  } catch (err) {
    console.error('Error seeding community testimonials:', err);
  } finally {
    await pool.end();
  }
}

seedCommunityTestimonials();
