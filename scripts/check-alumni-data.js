const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_ZGcWI3SBP7eg@ep-tiny-cherry-a1tbrbem-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const pool = new Pool({ connectionString });

async function checkAlumniData() {
  const client = await pool.connect();
  try {
    console.log('--- Checking Alumni Account & Linked Data ---');
    const alumniRes = await client.query(`
      SELECT 
        a.id, 
        a.name, 
        a.email, 
        a.role, 
        a."batchYear", 
        a."schoolId", 
        s."schoolName"
      FROM "Alumni" a
      LEFT JOIN "School" s ON a."schoolId" = s.id
      WHERE LOWER(a.email) = $1
    `, ['demo.alumni@madni.org']);

    const alumni = alumniRes.rows[0];
    console.log('Demo Alumni Account:', alumni);

    if (alumni) {
      // Check posts / blogs
      const blogs = await client.query('SELECT count(*) FROM "Blog" WHERE "alumniId" = $1', [alumni.id]);
      console.log('Blogs / Posts created by Demo Alumni:', blogs.rows[0].count);

      // Check achievements
      const achievements = await client.query('SELECT count(*) FROM "Achievement" WHERE "alumniId" = $1', [alumni.id]);
      console.log('Achievements created by Demo Alumni:', achievements.rows[0].count);

      // Check career opportunities
      const careers = await client.query('SELECT count(*) FROM "CareerOpportunity" WHERE "alumniId" = $1', [alumni.id]);
      console.log('Career Opportunities created by Demo Alumni:', careers.rows[0].count);

      // Check mentorship offers
      const mentorships = await client.query('SELECT count(*) FROM "MentorshipOffer" WHERE "alumniId" = $1', [alumni.id]);
      console.log('Mentorship Offers created by Demo Alumni:', mentorships.rows[0].count);

      // Check total blogs in school feed
      const schoolBlogs = await client.query('SELECT count(*) FROM "Blog" WHERE "schoolId" = $1 OR "schoolId" IS NULL', [alumni.schoolId]);
      console.log('Total Community Feed Posts in school:', schoolBlogs.rows[0].count);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAlumniData();
