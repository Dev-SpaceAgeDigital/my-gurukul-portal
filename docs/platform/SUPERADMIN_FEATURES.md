# Superadmin Features - Detailed Flow

The Superadmin portal is the central control layer for Madni Education. It manages organization-wide setup, school structure, administrator access, global monitoring, alumni communication, and public-facing master data.

## Feature 1: Secure Superadmin Login With OTP

Superadmin signs in from `/superadmin/login` using email and password. After valid credentials, the system sends a login OTP to the registered email. The user can enter the portal only after OTP verification.

This protects the highest-level admin account from simple password compromise. The OTP flow should use Redis in production for short-lived OTP storage, expiry, retry limits, and abuse prevention.

## Feature 2: Superadmin Dashboard Analytics

The dashboard gives Superadmin a central view of the platform. It should show real counts and summaries for schools, students, subadmins, alumni, public engagement, donation-related activity, and recent platform movement.

The purpose of this dashboard is quick decision-making. Superadmin should know whether schools are active, whether student/alumni records are growing, and whether important workflows are being used.

## Feature 3: Trust Management

Superadmin can create, view, edit, and manage Trust records. A trust represents the parent organization or trust body that can own or represent schools.

Trust data becomes useful on the public website and in school grouping. It also gives management a clean structure when multiple schools or centers are operated under the same trust umbrella.

## Feature 4: School Management

Superadmin can create and edit schools. Each school stores identity details, location, contact information, trust relation, student count, RTE/needy support details, and public-facing school information.

Schools are the main data boundary of the platform. Subadmins, students, alumni, events, school page content, donation projects, and monitoring records are connected to a school.

## Feature 5: Subadmin Management

Superadmin can create and edit Subadmin accounts and assign them to schools. Each Subadmin manages one school-level workspace.

This gives Superadmin central access control while allowing daily school operations to happen independently. When a school changes staff, Superadmin can update access without disturbing other schools.

## Feature 6: Academic Year Management

Superadmin can manage academic years globally. Academic year data helps keep students, standards, promotions, and reports organized by year.

Academic year setup is important before student imports, promotion workflows, and school-level reporting. A clean academic year structure prevents records from mixing across sessions.

## Feature 7: Standards and Class Structure

Superadmin can manage standard/class structures that are used by schools and Subadmins. Standards are connected with students, fees, academic years, promotion flow, and donation filters.

This feature keeps class naming and academic structure consistent across the platform. It also helps when reports are compared across schools.

## Feature 8: Global Students View

Superadmin can view student data across the system. This helps management understand total reach, school-wise student strength, needy student counts, and class-wise distribution.

Superadmin-level student visibility is mainly for oversight. Daily student creation and updates are normally handled by Subadmin inside the assigned school.

## Feature 9: Alumni Management and Communication

Superadmin can view alumni across schools and filter them by school and batch. Superadmin can select alumni and send communication, such as a Google Meet link email or alumni family invite.

This helps the trust run alumni programs, mentorship calls, fundraising discussions, reunions, career sessions, and school-support campaigns across multiple schools.

## Feature 10: Superadmin Monitoring

Superadmin monitoring shows important activity across the system. It includes activity logs and email logs, such as Subadmin actions, alumni activity, sent emails, failed emails, and communication history.

Monitoring gives accountability. It helps Superadmin understand who did what, when communication was sent, which school was involved, and whether actions succeeded or failed.

