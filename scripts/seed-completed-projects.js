const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_nJkM2R3sTLYZ@ep-divine-violet-a8eijyl3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function seedCompletedProjects() {
  try {
    console.log('Fetching schools for completed projects seed...');
    const schoolsRes = await pool.query('SELECT id, "schoolName" FROM "School"');

    if (schoolsRes.rows.length === 0) {
      console.log('No schools found. Cannot seed completed projects.');
      process.exit(1);
    }

    const sabriSchool = schoolsRes.rows.find(s => s.schoolName.includes('Sabri'))?.id || schoolsRes.rows[0].id;
    const markazSchool = schoolsRes.rows.find(s => s.schoolName.includes('Markaz'))?.id || schoolsRes.rows[1]?.id || sabriSchool;

    const sampleProjects = [
      {
        title: 'Modern Science Laboratory Block',
        description: 'Fully equipped physics, chemistry, and biology lab facilities for Std 9 to 12 students.',
        type: 'CONSTRUCTION',
        startDate: '2024-04-15',
        estimatedCost: 1500000.00,
        paidAmount: 1500000.00, // Fully funded and completed!
        mediaUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600',
        mediaType: 'IMAGE',
        schoolId: sabriSchool,
      },
      {
        title: 'Digital Library & E-Learning Center',
        description: 'Computerized library equipped with 3,000+ academic books and 15 digital terminals.',
        type: 'CONSTRUCTION',
        startDate: '2023-11-10',
        estimatedCost: 800000.00,
        paidAmount: 800000.00, // Fully funded and completed!
        mediaUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=600',
        mediaType: 'IMAGE',
        schoolId: markazSchool,
      },
      {
        title: 'New High School Classroom Block',
        description: 'Four new ventilated smart classrooms equipped with interactive displays.',
        type: 'CONSTRUCTION',
        startDate: '2023-06-01',
        estimatedCost: 1200000.00,
        paidAmount: 1200000.00, // Fully funded and completed!
        mediaUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=600',
        mediaType: 'IMAGE',
        schoolId: sabriSchool,
      },
      {
        title: 'Annual Sports & Youth Fitness Complex',
        description: 'Multi-purpose sports ground and outdoor activity arena for sports day and physical education.',
        type: 'EVENT',
        startDate: '2024-01-20',
        estimatedCost: 650000.00,
        paidAmount: 650000.00, // Fully funded and completed!
        mediaUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=600',
        mediaType: 'IMAGE',
        schoolId: markazSchool,
      },
    ];

    for (const proj of sampleProjects) {
      await pool.query(
        `INSERT INTO "Expense" (title, description, type, "startDate", "estimatedCost", "paidAmount", "mediaUrl", "mediaType", "schoolId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [
          proj.title,
          proj.description,
          proj.type,
          proj.startDate,
          proj.estimatedCost,
          proj.paidAmount,
          proj.mediaUrl,
          proj.mediaType,
          proj.schoolId,
        ]
      );
    }

    console.log('Successfully seeded completed project showcase expenses into PostgreSQL!');
  } catch (error) {
    console.error('Error seeding completed projects:', error);
  } finally {
    await pool.end();
  }
}

seedCompletedProjects();
