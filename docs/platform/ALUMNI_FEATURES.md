# Alumni Features - Detailed Flow

The Alumni portal connects approved old students with their school. Alumni can maintain their profile, participate in the community, share career opportunities, offer mentorship, contribute through donations, and support CSR referrals.

## Feature 25: Alumni Login With OTP

Alumni signs in from `/alumni/login` using email and password. After valid credentials, OTP verification is required before entering the portal.

This keeps alumni accounts safer and prevents direct access through password alone. OTPs should expire quickly and be rate-limited through Redis.

## Feature 26: Old Student Registration

Old students can register through the alumni registration flow. They select or identify their school and submit personal details.

The registration does not immediately create full access. The school Subadmin must verify and approve the request before login credentials are emailed.

## Feature 27: Alumni Dashboard

The Alumni dashboard gives a quick summary of alumni identity, school connection, contribution status, activity, and useful shortcuts.

The dashboard should be mobile-friendly because alumni may mostly use phones. It should show only useful information and avoid clutter.

## Feature 28: Alumni Profile

Alumni can manage their profile details such as name, batch year, current title, bio, contact details, LinkedIn/profile link, and profile image where supported.

Profile quality matters because alumni profiles can be shown in directory, spotlight, community, and public storytelling sections.

## Feature 29: Community Feed

The Community Feed shows approved alumni posts such as stories, achievements, jobs, internships, mentorship offers, and school/community updates.

Alumni can browse posts, read short previews, expand full content, and interact where supported. The feed should show clean cards on mobile.

## Feature 30: My Posts

My Posts lets alumni manage their own submitted content. Alumni can create or manage different post types from one place.

Posts may be pending, approved, rejected, or visible depending on the moderation rules. This lets the school keep public/community content clean.

## Feature 31: Career Opportunities

Alumni can post jobs and internships for the community. These opportunities help students and other alumni discover real career openings from trusted alumni.

Career posts should include title, company, work mode, location, role type, description, and contact/application details.

## Feature 32: Stories, Blogs, and Achievements

Alumni can share stories, blogs, achievements, and life updates. These posts build community pride and show the impact of Madni Education.

Approved stories can also help public website content by showing real alumni outcomes and inspiration.

## Feature 33: Mentorship and Find Alumni

Alumni can offer mentorship and use Find Alumni to discover other alumni. This creates a network for guidance, career help, education advice, and collaboration.

Find Alumni should support search and filtering so users can quickly locate alumni by school, batch, name, or professional details.

## Feature 34: Give Back, Donations, CSR, and Spotlight

Alumni can give back through active donation needs and projects. The portal should show active needs, completed project filters, donation history, and how much the alumni has donated.

CSR Referral allows alumni to share company/contact details for possible CSR support. Alumni Spotlight highlights selected alumni and opens a detail modal explaining why they were selected.

