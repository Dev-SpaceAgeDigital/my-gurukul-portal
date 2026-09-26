# Platform Relationships, Deployment, KVM 2 Plan, and Credentials

This document explains how the Superadmin, Subadmin, Alumni, School, and userside website relate to each other. It also explains why Hostinger KVM 2 is a good first production deployment option and provides a credential handover section.

## 1. Main Relationship Model

The platform is school-centered.

| Entity | Connected With | Purpose |
| --- | --- | --- |
| Trust | Schools | Parent organization or management body. |
| School | Trust, Subadmin, Students, Alumni, Events, Donations, School Page | Main operating unit of the system. |
| Superadmin | All trusts, schools, subadmins, global alumni, monitoring | Central owner and controller of the whole platform. |
| Subadmin | One assigned school | Daily school-level operator. |
| Student | School, Standard, Academic Year | Current student record used for school management, promotion, donation support, and alumni conversion. |
| Alumni | School, Posts, Donations, CSR, Monitoring | Approved old student connected back to the school. |
| Userside Website | Public school, alumni, donation, event, CSR, and update data | Public visibility and engagement layer. |

## 2. Superadmin to School Flow

Superadmin creates and manages the school. The school record becomes the base for Subadmin access, student records, school page content, events, projects, alumni, and public website visibility.

Without school setup, Subadmin cannot properly manage school-specific data. Every major operational record should be connected to a `schoolId`.

## 3. Superadmin to Subadmin Flow

Superadmin creates Subadmin accounts and assigns each Subadmin to a school. The Subadmin then logs in and manages only that assigned school.

This keeps access clean. One school operator should not accidentally change another school's data.

## 4. Subadmin to Student Flow

Subadmin creates or imports student data for the school. Students are connected to standards/classes and academic years.

Student data powers school analytics, class setup, promotion, needy/RTE reports, sponsorship needs, and future alumni conversion.

## 5. Student to Alumni Flow

When a student becomes an old student/pass-out, the school can authorize that person as alumni. The system creates an alumni record and sends credentials after approval.

This creates a clean bridge from school operations to alumni community.

## 6. Old Student to Alumni Flow

Old students who are not already in the student list can register publicly. They select or identify their school and submit details.

The school Subadmin must verify and approve the request. Only after approval does the system generate alumni access and send login credentials.

## 7. Alumni to School Flow

Alumni remain connected to their school. Their posts, donations, CSR referrals, mentorship, achievements, and activity can be monitored by the relevant Subadmin.

This makes the alumni portal useful for real school development, not only social networking.

## 8. Website to Admin Flow

The userside website displays public data that comes from Superadmin, Subadmin, Alumni, and public forms.

Examples:

- School detail comes from school and school-page content.
- Updates come from admin-managed update modules.
- Events/gallery come from Subadmin school event modules.
- Donation needs come from school projects and donation records.
- Alumni stories come from approved alumni content.
- CSR inquiries come from public/alumni CSR forms.

## 9. Email Flow

Email is used for:

- Superadmin login OTP.
- Subadmin login OTP.
- Alumni login OTP.
- Alumni forgot/reset password OTP.
- Alumni approval credentials.
- Alumni access reset credentials.
- Alumni family invite emails.
- Google Meet link emails.
- CSR and donation-related follow-up emails.

All important email sends should be logged in `EmailLog` so Superadmin/Subadmin can audit communication.

## 10. Monitoring Flow

Monitoring connects activity across portals.

| Action | Who Can See |
| --- | --- |
| Subadmin activity | Superadmin and relevant Subadmin monitoring where applicable. |
| Alumni post/create/edit/delete activity | Relevant Subadmin and Superadmin monitoring. |
| Email sent/failed/received logs | Superadmin globally, Subadmin for school-specific data. |
| Alumni password reset/access reset | Relevant monitoring logs for accountability. |

## 11. Why Hostinger KVM 2 Helps

Hostinger KVM 2 is suitable for the first production launch because the platform can run as one Next.js application with PostgreSQL, Redis, Nginx, and PM2 on a single VPS.

It is a strong low-cost starting point when:

- Traffic is school/community level.
- Media is uploaded to ImageKit instead of stored heavily on the VPS.
- Redis is used for OTP/rate-limiting and not huge queue processing.
- PostgreSQL is backed up properly.
- Security hardening is done before launch.

## 12. KVM 2 Plan Details Provided

| Item | Detail |
| --- | --- |
| Plan | Hostinger KVM 2 VPS hosting |
| Period | 24 months |
| Discounted monthly price | ₹779/month |
| Original shown monthly price | ₹2,099/month |
| Renewal price | ₹1,199/month for 24 months after first term |
| Savings shown | ₹31,680 |
| Free domain | Free domain for 1 year |
| Server location | India, shown latency 22 ms |
| Optional daily auto-backup | ₹589/month |
| Discounted order total | ₹22,061.28 including shown taxes |
| Effective monthly from shown total | About ₹919.22/month over 24 months |
| Backup estimate | ₹589 x 24 = ₹14,136 extra before tax recalculation |
| Approx total with backup | ₹36,197.28 before tax recalculation |
| Pricing link | https://www.hostinger.com/in/vps-hosting |
| Terms link | https://www.hostinger.com/in/legal/universal-terms-of-service-agreement |
| Privacy link | https://www.hostinger.com/in/legal/privacy-policy |

## 13. Recommended Production Stack on KVM 2

| Layer | Recommendation |
| --- | --- |
| OS | Ubuntu LTS |
| Runtime | Node.js LTS |
| Web server | Nginx reverse proxy |
| App process | PM2 |
| Database | PostgreSQL |
| Cache/security store | Redis |
| Media | ImageKit |
| SSL | Let’s Encrypt Certbot |
| Email | Brevo, Resend, Amazon SES, or other transactional email service |
| Payments | Razorpay production keys in environment variables |
| Backups | Hostinger daily auto-backup plus separate PostgreSQL dump backup |

## 14. KVM 2 Security Checklist

- Create a non-root deploy user.
- Disable root SSH login.
- Use SSH key login only.
- Disable password SSH login.
- Enable UFW firewall.
- Allow only SSH, HTTP, and HTTPS publicly.
- Keep PostgreSQL bound to localhost.
- Keep Redis bound to localhost.
- Install Fail2ban.
- Enable unattended security updates.
- Use Nginx with HTTPS.
- Keep `.env` outside Git.
- Use strong `JWT_SECRET`, database password, Redis password, and email API keys.
- Use Redis rate limiting for login and sensitive APIs.
- Keep ImageKit/private keys only in environment variables.
- Configure log rotation.
- Monitor disk, RAM, CPU, app errors, and SSL renewal.
- Test database restore before launch.

## 15. Credential Handover

Real production passwords should be filled only during final deployment handover. Passwords should not be committed to Git or shared in public documents.

The current codebase does not contain reliable final production passwords for Superadmin, Subadmin, and Alumni. The table below is the required handover format and should be completed after the production database users are created.

| Portal | Login URL | Email | Password | Notes |
| --- | --- | --- | --- | --- |
| Superadmin | `/superadmin/login` | `[fill production superadmin email]` | `[fill production password]` | OTP will be sent to this email after password verification. |
| Subadmin | `/subadmin/login` | `[fill school subadmin email]` | `[fill production password]` | Created/assigned by Superadmin for a specific school. |
| Alumni | `/alumni/login` | `[approved alumni email]` | `[temporary password generated after approval/reset]` | Alumni receives credentials only after school approval or access reset. |

## 16. Suggested First Production Credentials Policy

Use this policy during production setup:

| Role | Email Rule | Password Rule |
| --- | --- | --- |
| Superadmin | Use official trust/admin email only. | Generate a strong unique password and enable OTP. |
| Subadmin | Use official school/admin email only. | Generate school-specific password and force secure storage. |
| Alumni | Use verified alumni personal email. | Temporary password should be emailed after approval and changed by alumni later. |

## 17. Final Deployment Recommendation

KVM 2 is a good first production choice if the team accepts server maintenance responsibility. The platform can run well on this plan because media is offloaded to ImageKit and Redis/PostgreSQL can run locally on the VPS.

For long-term safety, take the daily auto-backup option or maintain a separate database backup strategy. A cheap VPS without backup is risky for a school/donation/alumni platform because data loss would be serious.

## 18. Privacy Policy and Terms Documents

The platform should publish privacy policy and terms/conditions pages before production launch. Draft documents have been prepared for:

- Alumni Privacy Policy.
- Alumni Terms and Conditions.
- Subadmin Privacy Policy.
- Subadmin Terms and Conditions.
- School and Public Website Privacy Policy.
- School and Public Website Terms and Conditions.

These are legal-facing documents and should be reviewed by a qualified legal professional before being published on the live website or used for formal consent.
