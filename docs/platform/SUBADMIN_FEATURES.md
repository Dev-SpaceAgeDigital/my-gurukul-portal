# Subadmin Features - Detailed Flow

The Subadmin portal is the school operating workspace. A Subadmin is attached to one school and manages daily records, students, school page content, donations, projects, alumni approvals, events, monitoring, and school-level communication.

## Feature 11: Secure Subadmin Login With OTP

Subadmin signs in from `/subadmin/login` using email and password. After credentials are accepted, the system sends an OTP to the Subadmin email. Only after OTP verification can the school dashboard be accessed.

This protects school data and prevents unauthorized access if a password is leaked. In production, Redis should store OTP values, attempt counters, and expiry windows.

## Feature 12: School-Specific Dashboard

The Subadmin dashboard shows school-level analytics. It should show real data such as students, standards, needy/RTE counts, alumni, events, donation/project status, and recent activity.

This dashboard should help the school operator understand what needs attention without opening every module separately.

## Feature 13: Academic Setup

Subadmin can manage or use academic year setup for the school. Academic year data is required for student records, promotions, donation filters, and annual reporting.

This keeps student movement organized year by year and avoids confusion between current and previous academic sessions.

## Feature 14: Class and Standard Setup

Subadmin can work with standards/classes that belong to the school. Class setup supports fees, student grouping, standard-wise filters, needy analytics, and promotion workflows.

Good class setup makes the rest of the school management smoother because student records, reports, and donation ledgers depend on accurate standard data.

## Feature 15: Student Management

Subadmin can create, view, edit, and manage student records for the assigned school. Student details include personal data, class, academic year, fees, family/contact information, needy/RTE flags, and timeline activity.

The student module is one of the most important school modules because donations, promotions, alumni conversion, and analytics depend on accurate student data.

## Feature 16: Student Import and Bulk Actions

Subadmin can import students and use bulk operations where supported. This is useful when a school has many records and manual entry would take too much time.

Bulk import should be used carefully with clean templates and validation. Wrong imports can affect dashboard counts, donation needs, and promotion data.

## Feature 17: Student Promotion

Subadmin can promote students from one academic year or class level to the next. Promotion keeps student records moving forward without manually recreating the same student every year.

Promotion also helps identify pass-outs or old students who can later be moved into alumni workflows after school approval.

## Feature 18: School Page and School Hub Management

Subadmin can manage public school content through School Hub and School Page sections. This includes profile information, school highlights, facilities, programs, teachers, admission details, donation information, and media.

This content appears on public-facing school pages and helps parents, donors, alumni, and visitors understand the school.

## Feature 19: Events and Gallery Management

Subadmin can add, edit, and manage school events and event media. Events can include titles, descriptions, category, date, gallery images, and school-related activity details.

The event gallery helps keep the public website active and credible because visitors can see real school activity and community participation.

## Feature 20: Updates and Announcements

Subadmin can manage school updates, announcements, and news-like content. Updates are used to keep school pages and userside sections fresh.

This feature is important for communication. It can show achievements, notices, campaign updates, school activities, and donor-facing progress.

## Feature 21: Accounts, Projects, and Donation Ledger

Subadmin can manage school accounts-related project data, sponsorship projects, new projects, edit project pages, project media, and donation ledger filters.

Donation ledger filters should support category, standard/project, and year. This helps the school explain where money is needed, where it has been used, and which records belong to which category.

## Feature 22: Alumni Requests and Alumni Approval

Subadmin can approve old-student alumni registration requests. An old student does not become an authorized alumni immediately. The school Subadmin must verify the person and approve the request.

After approval, the system creates the alumni account, generates temporary credentials, and sends the login details by email.

## Feature 23: Alumni Access Reset

Subadmin can reset alumni access when an alumni forgets login details or cannot access the portal. The reset creates a temporary password and emails it to the alumni.

This helps the school support alumni without manually changing database values. It should be logged in monitoring for accountability.

## Feature 24: Subadmin Monitoring and Email Automation

Subadmin can view school-level monitoring tabs for Subadmin activity, alumni activity, and email logs. The email automation section explains which events trigger emails and allows supported triggers.

This helps the school team know what has happened in the portal, what alumni did, and which emails were sent or failed.

