require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function seedFatimaVohra() {
  try {
    console.log('Seeding complete profile, story, achievements, jobs, internships, and mentorships for Fatima Vohra...');

    const schoolsRes = await pool.query('SELECT id, "schoolName" FROM "School"');
    if (schoolsRes.rows.length === 0) {
      console.error('No schools found.');
      process.exit(1);
    }

    const school = schoolsRes.rows.find(s => s.schoolName.includes('MARKAZ')) || schoolsRes.rows[0];
    const schoolId = school.id;
    const schoolName = school.schoolName;

    const email = 'fatimavohra@gmail.com';
    const passwordHash = await bcrypt.hash('2dd3460a', 10);
    const accessKey = '2dd3460a';

    // 1. INSERT OR UPDATE ALUMNI PROFILE
    const alumniRes = await pool.query(
      `INSERT INTO "Alumni" (
        id, name, email, password, "batchYear", "currentTitle", "currentBio", 
        "profilePic", "linkedIn", "workLink", "schoolId", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password = EXCLUDED.password,
        "batchYear" = EXCLUDED."batchYear",
        "currentTitle" = EXCLUDED."currentTitle",
        "currentBio" = EXCLUDED."currentBio",
        "profilePic" = EXCLUDED."profilePic",
        "linkedIn" = EXCLUDED."linkedIn",
        "workLink" = EXCLUDED."workLink",
        "schoolId" = EXCLUDED."schoolId",
        "updatedAt" = NOW()
      RETURNING id`,
      [
        'Fatima Vohra',
        email,
        passwordHash,
        '2018',
        'Senior Software Engineer & AI Researcher at Google',
        'Alumna of Markaz Public School. Studied on Madni Trust Zakat scholarship aid. Passionate about cloud infrastructure, empowering young girls in STEM, and mentoring students across Gujarat.',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
        'https://linkedin.com/in/fatimavohra',
        'https://google.com',
        schoolId,
      ]
    );

    let alumniId = alumniRes.rows[0]?.id;
    if (!alumniId) {
      const ex = await pool.query('SELECT id FROM "Alumni" WHERE email = $1 LIMIT 1', [email]);
      alumniId = ex.rows[0].id;
    }

    console.log(`Fatima Vohra Alumni ID: ${alumniId}`);

    // 2. SEED PROPER STORY (BLOG)
    await pool.query(
      `INSERT INTO "Blog" (id, title, content, status, "isFeatured", "isTopFeatured", "schoolId", "alumniId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, 'APPROVED', true, true, $3, $4, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [
        `From Markaz Public School Classrooms to Senior Software Engineer at Google`,
        `Coming from a humble family in Karjan, pursuing higher education felt like a distant dream. Madni Education Trust stepped in with full Zakat educational aid, covering my tuition, textbooks, and computer lab access at Markaz Public School.\n\nMy dedicated teachers nurtured my interest in mathematics and computer science. After securing 94.8% in GSEB Board exams, I earned admission to B.Tech Computer Science and subsequently joined Google as a Senior Software Engineer. Today, I am proud to contribute back to Madni Trust to educate 15 underprivileged students every year.`,
        schoolId,
        alumniId,
      ]
    );

    // 3. SEED PROPER ACHIEVEMENTS
    const achievements = [
      {
        title: `Google Women in Tech Leadership Award 2025`,
        desc: `Recognized globally for contributions to cloud infrastructure & AI research while mentoring 50+ underprivileged female students in computer science.`,
        cat: `Career Excellence`,
      },
      {
        title: `Gujarat State Science & Coding Gold Medalist`,
        desc: `Secured 1st rank in Gujarat State Computer Science Olympiad during final year at Markaz Public School.`,
        cat: `Academic Milestone`,
      },
    ];

    for (const ach of achievements) {
      await pool.query(
        `INSERT INTO "Achievement" (id, title, description, category, status, "isFeatured", "schoolId", "alumniId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, 'APPROVED', true, $4, $5, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [ach.title, ach.desc, ach.cat, schoolId, alumniId]
      );
    }

    // 4. SEED PROPER JOBS & INTERNSHIPS (CareerOpportunity Table)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "CareerOpportunity" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "alumniId" UUID REFERENCES "Alumni"(id) ON DELETE CASCADE,
        "schoolId" UUID REFERENCES "School"(id) ON DELETE CASCADE,
        "type" VARCHAR(20) CHECK ("type" IN ('JOB', 'INTERNSHIP')),
        "companyName" VARCHAR(255) NOT NULL,
        "companyLink" TEXT,
        "role" VARCHAR(255) NOT NULL,
        "relation" TEXT,
        "description" TEXT,
        "status" VARCHAR(20) DEFAULT 'APPROVED',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    const careers = [
      {
        type: 'JOB',
        company: 'Google Cloud India',
        link: 'https://careers.google.com',
        role: 'Senior Software Engineer (SDE-2)',
        relation: 'Direct Employee & Referral Partner',
        desc: 'Leading distributed cloud infrastructure teams and offering internal job referrals for high-performing Madni Trust graduates.',
      },
      {
        type: 'INTERNSHIP',
        company: 'IIT Bombay AI Lab',
        link: 'https://iitb.ac.in',
        role: 'Graduate AI Research Intern',
        relation: 'Research Scholar',
        desc: '6-month stipend research internship in Machine Learning and Computer Vision for 3rd and 4th year B.Tech students.',
      },
      {
        type: 'INTERNSHIP',
        company: 'Tata Consultancy Services (TCS)',
        link: 'https://tcs.com',
        role: 'Frontend & Web Engineering Intern',
        relation: 'Alumni Network Partner',
        desc: 'Summer 2026 3-month software development internship opportunity for diploma and undergraduate engineering students.',
      },
    ];

    for (const car of careers) {
      await pool.query(
        `INSERT INTO "CareerOpportunity" (id, "alumniId", "schoolId", type, "companyName", "companyLink", role, relation, description, status, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 'APPROVED', NOW(), NOW())`,
        [alumniId, schoolId, car.type, car.company, car.link, car.role, car.relation, car.desc]
      );
    }

    // 5. SEED PROPER MENTORSHIPS (MentorshipOffer Table)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "MentorshipOffer" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "alumniId" UUID REFERENCES "Alumni"(id) ON DELETE CASCADE,
        "schoolId" UUID REFERENCES "School"(id) ON DELETE CASCADE,
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT NOT NULL,
        "targetStudent" TEXT,
        "availability" TEXT,
        "status" VARCHAR(20) DEFAULT 'APPROVED',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    const mentorships = [
      {
        title: '1-on-1 Software Engineering & Tech Career Guidance',
        desc: 'Personalized 1-on-1 mentorship for high school and diploma students preparing for engineering entrance exams, computer science degrees, coding roadmaps, and IT job interviews.',
        target: 'Std 10, 11, 12 Science & Computer Diploma Students',
        avail: 'Weekends (Saturday & Sunday 4 PM - 6 PM IST)',
      },
      {
        title: 'Women in STEM & Tech Leadership Fellowship',
        desc: 'Dedicated career guidance and scholarship application mentoring for female students aiming for engineering, AI, and computer science degrees.',
        target: 'Girls in Std 11 & 12 Science',
        avail: 'Alternate Saturdays (5 PM IST)',
      },
    ];

    for (const m of mentorships) {
      await pool.query(
        `INSERT INTO "MentorshipOffer" (id, "alumniId", "schoolId", title, description, "targetStudent", availability, status, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'APPROVED', NOW(), NOW())`,
        [alumniId, schoolId, m.title, m.desc, m.target, m.avail]
      );
    }

    console.log('Successfully seeded COMPLETE data for Fatima Vohra (Profile, Story, Achievements, Jobs, Internships, Mentorships)!');
  } catch (err) {
    console.error('Error seeding Fatima Vohra profile:', err);
  } finally {
    await pool.end();
  }
}

seedFatimaVohra();
