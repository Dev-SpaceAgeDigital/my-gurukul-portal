const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_ZGcWI3SBP7eg@ep-tiny-cherry-a1tbrbem-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({ connectionString });

async function seedDemoAccounts() {
  const client = await pool.connect();
  try {
    console.log('--- Starting Demo Accounts Seeding ---');

    // Get an existing school ID or fallback to creating one if needed
    let schoolRes = await client.query('SELECT id, "schoolName" FROM "School" LIMIT 1');
    let schoolId = null;
    let schoolName = 'Madni Education Trust Main School';

    if (schoolRes.rows.length === 0) {
      console.log('No existing school found. Creating a default school for demo accounts...');
      const createSchoolRes = await client.query(`
        INSERT INTO "School" ("schoolName", "medium", "establishYear")
        VALUES ($1, $2, $3)
        RETURNING id, "schoolName"
      `, [schoolName, 'English', 2005]);
      schoolId = createSchoolRes.rows[0].id;
    } else {
      schoolId = schoolRes.rows[0].id;
      schoolName = schoolRes.rows[0].schoolName;
    }

    console.log(`Linking demo Subadmin and Alumni to school: "${schoolName}" (${schoolId})`);

    // 1. Superadmin Demo Account
    const superAdminPasswordHash = await bcrypt.hash('DemoSuperAdmin123!', 10);
    const superAdminEmail = 'demo.superadmin@madni.org';

    await client.query(`
      INSERT INTO "User" ("id", "name", "email", "password", "role", "updatedAt")
      VALUES ($1, 'Demo Superadmin', $2, $3, 'SUPER_ADMIN', NOW())
      ON CONFLICT ("email") 
      DO UPDATE SET 
        "name" = EXCLUDED.name,
        "password" = EXCLUDED.password,
        "role" = EXCLUDED.role,
        "updatedAt" = NOW()
    `, [crypto.randomUUID(), superAdminEmail, superAdminPasswordHash]);
    console.log(`✅ Superadmin test account created/updated: ${superAdminEmail} / DemoSuperAdmin123!`);

    // 2. Subadmin Demo Account
    const subAdminPasswordHash = await bcrypt.hash('DemoSubAdmin123!', 10);
    const subAdminEmail = 'demo.subadmin@madni.org';

    await client.query(`
      INSERT INTO "User" ("id", "name", "email", "password", "role", "schoolId", "updatedAt")
      VALUES ($1, 'Demo Subadmin', $2, $3, 'SUB_ADMIN', $4, NOW())
      ON CONFLICT ("email") 
      DO UPDATE SET 
        "name" = EXCLUDED.name,
        "password" = EXCLUDED.password,
        "role" = EXCLUDED.role,
        "schoolId" = EXCLUDED."schoolId",
        "updatedAt" = NOW()
    `, [crypto.randomUUID(), subAdminEmail, subAdminPasswordHash, schoolId]);
    console.log(`✅ Subadmin test account created/updated: ${subAdminEmail} / DemoSubAdmin123!`);

    // 3. Alumni Demo Account
    const alumniPasswordHash = await bcrypt.hash('DemoAlumni123!', 10);
    const alumniEmail = 'demo.alumni@madni.org';

    const alumniRes = await client.query(`
      INSERT INTO "Alumni" ("id", "name", "email", "password", "role", "batchYear", "schoolId", "updatedAt")
      VALUES ($1, 'Demo Alumni', $2, $3, 'ALUMNI', 2020, $4, NOW())
      ON CONFLICT ("email") 
      DO UPDATE SET 
        "name" = EXCLUDED.name,
        "password" = EXCLUDED.password,
        "role" = EXCLUDED.role,
        "batchYear" = EXCLUDED."batchYear",
        "schoolId" = EXCLUDED."schoolId",
        "updatedAt" = NOW()
      RETURNING id
    `, [crypto.randomUUID(), alumniEmail, alumniPasswordHash, schoolId]);

    const alumniId = alumniRes.rows[0].id;
    console.log(`✅ Alumni test account created/updated: ${alumniEmail} / DemoAlumni123!`);

    // 4. Sample Blog/Post for Demo Alumni
    await client.query(`
      INSERT INTO "Blog" ("id", "alumniId", "schoolId", "title", "content", "tags", "mediaUrl", "mediaType", "status", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'IMAGE', 'APPROVED', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [
      alumniId,
      schoolId,
      'Navigating Technology Careers: Advice for Madni Students',
      'Sharing key lessons from my journey in tech after graduating in 2020. Focus on problem-solving, continuous learning, and giving back to our community.',
      ['Tech', 'Career Advice'],
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=600'
    ]);

    // 5. Sample Career Opportunity for Demo Alumni
    await client.query(`
      INSERT INTO "CareerOpportunity" ("id", "alumniId", "schoolId", "type", "companyName", "companyLink", "role", "relation", "description", "status", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, 'INTERNSHIP', 'Zynteq Tech Solutions', 'https://zynteq.com', 'Frontend Developer Intern', 'Alumni Enterprise', 'Paid 3-month summer internship for fresh graduates & young alumni.', 'APPROVED', NOW(), NOW())
    `, [alumniId, schoolId]);

    // 6. Sample Mentorship Offer for Demo Alumni
    await client.query(`
      INSERT INTO "MentorshipOffer" ("id", "alumniId", "schoolId", "title", "description", "targetStudent", "availability", "status", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, 'Software Engineering & Resume Review Mentorship', '1-on-1 guidance for Std 11 & 12 students interested in Computer Science and Engineering careers.', 'Std 11th & 12th Students', 'Weekends (Sat & Sun 4pm-6pm)', 'APPROVED', NOW(), NOW())
    `, [alumniId, schoolId]);

    console.log('✅ Sample Post, Career Job, and Mentorship created for Demo Alumni!');

    console.log('\n✨ Demo Accounts Seeding Complete! ✨');
  } catch (err) {
    console.error('❌ Error seeding demo accounts:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDemoAccounts();
