require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function seedSchool4Sections() {
  try {
    const schoolsRes = await pool.query('SELECT id, "schoolName" FROM "School"');
    console.log(`Found ${schoolsRes.rows.length} schools:`, schoolsRes.rows.map(s => s.schoolName));

    // Ensure AcademicYear exists
    let ayRes = await pool.query('SELECT id FROM "AcademicYear" WHERE label = \'2024-25\' LIMIT 1');
    let academicYearId = ayRes.rows[0]?.id;
    if (!academicYearId) {
      const newAy = await pool.query('INSERT INTO "AcademicYear" (id, label, "statusTag", "createdAt", "updatedAt") VALUES (gen_random_uuid(), \'2024-25\', \'CURRENT\', NOW(), NOW()) RETURNING id');
      academicYearId = newAy.rows[0].id;
    }

    for (const school of schoolsRes.rows) {
      const schoolId = school.id;
      const schoolName = school.schoolName;
      const prefix = schoolName.split(' ')[0];

      // 1. SEED STANDARDS (Academic Programs)
      const standardsList = [
        { name: '1', div: 'A', fees: 6000, stream: null },
        { name: '5', div: 'A', fees: 8000, stream: null },
        { name: '10', div: 'A', fees: 10000, stream: null },
        { name: '11', div: 'A', fees: 12000, stream: 'Commerce' },
        { name: '12', div: 'A', fees: 14000, stream: 'Commerce' },
        { name: '12', div: 'B', fees: 15000, stream: 'Science' },
      ];

      const stdMap = {};
      for (const std of standardsList) {
        const stdRes = await pool.query(
          `INSERT INTO "Standard" (id, "standardName", division, stream, fees, "schoolId", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [std.name, std.div, std.stream, std.fees, schoolId]
        );
        let stdId = stdRes.rows[0]?.id;
        if (!stdId) {
          const ex = await pool.query(`SELECT id FROM "Standard" WHERE "schoolId" = $1 AND "standardName" = $2 LIMIT 1`, [schoolId, std.name]);
          stdId = ex.rows[0]?.id;
        }
        stdMap[std.name] = stdId;
      }

      // 2. SEED TOPPERS (1 from 10th, 1 from 11th, 1 from 12th)
      const toppersData = [
        { name: `Fatima Vohra (${prefix} 10th)`, stdName: '10', rank: 1, pct: 94.8 },
        { name: `Amaan Sheikh (${prefix} 11th)`, stdName: '11', rank: 1, pct: 92.5 },
        { name: `Zaid Patel (${prefix} 12th)`, stdName: '12', rank: 1, pct: 96.2 },
      ];

      for (const topper of toppersData) {
        const stdId = stdMap[topper.stdName];
        if (stdId) {
          // Create Student
          const stuRes = await pool.query(
            `INSERT INTO "Student" (id, name, "schoolId", "standardId", "isNeedy", "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, $2, $3, false, NOW(), NOW())
             RETURNING id`,
            [topper.name, schoolId, stdId]
          );
          const studentId = stuRes.rows[0].id;

          // Create Enrollment as PROMOTED / GRADUATED with rank & percentage
          await pool.query(
            `INSERT INTO "StudentEnrollment" (id, "studentId", "standardId", "academicYearId", status, rank, percentage, "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, $2, $3, 'GRADUATED', $4, $5, NOW(), NOW())`,
            [studentId, stdId, academicYearId, topper.rank, topper.pct]
          );
        }
      }

      // 3. SEED SCHOOL PAGE CONTENT (Facilities & Life Beyond Classroom)
      const facilities = [
        { title: "Smart Classrooms", icon: "school", description: "Interactive smart displays, ergonomic seating, and ventilated spacious classrooms." },
        { title: "Advanced Science Labs", icon: "science", description: "State-of-the-art physics, chemistry, and biology laboratories." },
        { title: "Digital Library & IT Hub", icon: "computer", description: "Computerized library with 4,000+ academic books and high-speed internet." },
        { title: "Sports Arena & Turf", icon: "sports", description: "Multi-purpose sports ground for cricket, football, volleyball, and athletics." },
        { title: "Deeniyat & Ethics Center", icon: "book", description: "Dedicated Islamic moral studies, Quranic recitation, and character development rooms." },
        { title: "Safe Transport Fleet", icon: "bus", description: "GPS-enabled school buses with verified drivers covering all major Karjan routes." },
      ];

      const activities = [
        { title: "Annual Sports Meet", category: "Sports", description: "Inter-house athletics, cricket tournaments, and martial arts demonstrations." },
        { title: "State Science Fair", category: "Academics", description: "Robotics projects, solar energy models, and environmental science exhibits." },
        { title: "Naat & Qirat Competition", category: "Deeniyat", description: "Annual Quranic recitation and Islamic cultural heritage festival." },
        { title: "Independence Day Celebration", category: "Cultural", description: "Patriotic parade, drama skits, and student excellence awards." },
        { title: "Coding & STEM Club", category: "Clubs", description: "Weekly computer programming, web design, and digital literacy workshops." },
        { title: "Community Tree Plantation", category: "Clubs", description: "Student-led environmental awareness and green campus initiatives." },
      ];

      const teachers = [
        { name: "Maulana Shabbir Ahmad", designation: "Principal", qualification: "M.A., B.Ed., Alimiyyah", experience: "18 Years", subject: "Administration & Ethics" },
        { name: "Sajid Mansuri", designation: "Vice Principal & Science HOD", qualification: "M.Sc. Physics, B.Ed", experience: "12 Years", subject: "Physics & Science" },
        { name: "Sultana Sheikh", designation: "Senior Mathematics Teacher", qualification: "B.Sc. Math, B.Ed", experience: "9 Years", subject: "Mathematics" },
        { name: "Imran Vohra", designation: "IT & Computer Instructor", qualification: "B.C.A., M.C.A.", experience: "7 Years", subject: "Computer Science" },
      ];

      // Check if SchoolPageContent table exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "SchoolPageContent" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "schoolId" UUID REFERENCES "School"(id) ON DELETE CASCADE UNIQUE,
          "facilities" JSONB,
          "activities" JSONB,
          "teachers" JSONB,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )
      `);

      await pool.query(
        `INSERT INTO "SchoolPageContent" (id, "schoolId", facilities, activities, teachers, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT ("schoolId") DO UPDATE SET
           facilities = EXCLUDED.facilities,
           activities = EXCLUDED.activities,
           teachers = EXCLUDED.teachers,
           "updatedAt" = NOW()`,
        [schoolId, JSON.stringify(facilities), JSON.stringify(activities), JSON.stringify(teachers)]
      );
    }

    console.log('Successfully seeded 4 Sections (Programs, Results, Facilities, Life Beyond Classroom) for all schools!');
  } catch (err) {
    console.error('Error seeding school 4 sections:', err);
  } finally {
    await pool.end();
  }
}

seedSchool4Sections();
