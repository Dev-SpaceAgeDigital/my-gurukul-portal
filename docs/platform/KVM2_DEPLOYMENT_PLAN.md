# Hostinger KVM 2 Deployment Plan

This document explains why the Hostinger KVM 2 VPS plan is suitable for the Madni Education Platform, what it provides, how we will set it up, and how we will use it in production.

## 1. Why KVM 2 Is Suitable

The Madni Education Platform is a full Next.js application with:

- Public website.
- Superadmin portal.
- Subadmin portal.
- Alumni portal.
- PostgreSQL database.
- Redis for OTP/rate limiting.
- ImageKit for media uploads.
- Email provider for OTP and communication.
- Razorpay/payment integration where required.

For the first production launch, KVM 2 is suitable because one VPS can run the application, database, Redis, Nginx, SSL, and process manager at a low monthly cost.

The platform media will be handled by ImageKit, so the VPS does not need to store heavy images locally. This makes KVM 2 more practical and cost-effective.

## 2. KVM 2 Plan Details

Based on the provided Hostinger cart:

| Item | Details |
| --- | --- |
| Plan | KVM 2 VPS Hosting |
| Billing period | 24 months |
| Discounted price | ₹779/month |
| Original shown price | ₹2,099/month |
| Renewal price | ₹1,199/month after 24 months |
| Savings shown | ₹31,680 |
| Free domain | Free domain for 1 year |
| Server location | India |
| Shown latency | 22 ms |
| Daily auto-backup | Optional, ₹589/month |
| Discounted total | ₹22,061.28 including shown taxes |
| Effective monthly cost | About ₹919.22/month over 24 months |
| Approx total with backup | ₹36,197.28 before tax recalculation |
| Pricing link | https://www.hostinger.com/in/vps-hosting |

## 3. What KVM 2 Will Provide

KVM 2 provides a virtual private server where we get full control of the server environment.

It gives us:

- Dedicated VPS environment.
- Root/server-level access.
- Ability to install Ubuntu.
- Ability to install Node.js.
- Ability to install PostgreSQL.
- Ability to install Redis.
- Ability to install Nginx.
- Ability to configure SSL certificates.
- Ability to run the Next.js app with PM2.
- Ability to manage environment variables.
- Ability to configure custom domain and DNS.
- Ability to run backups and maintenance scripts.

This is different from shared hosting because we control the full stack.

## 4. Recommended Server Location

Choose India as the server location.

Reason:

- Most users are expected to be from India.
- Admins, schools, alumni, and donors will get lower latency.
- The provided cart shows India latency around 22 ms.

## 5. Recommended Operating System

Use Ubuntu LTS.

Recommended:

- Ubuntu 24.04 LTS if supported.
- Ubuntu 22.04 LTS if 24.04 is not available or if compatibility is preferred.

Ubuntu is recommended because it has stable support for Node.js, PostgreSQL, Redis, Nginx, Certbot, PM2, and common deployment tooling.

## 6. Production Architecture

The KVM 2 server will run:

| Layer | Tool |
| --- | --- |
| Operating system | Ubuntu LTS |
| Reverse proxy | Nginx |
| SSL certificate | Let’s Encrypt Certbot |
| Application runtime | Node.js LTS |
| App process manager | PM2 |
| Frontend/backend app | Next.js production build |
| Database | PostgreSQL |
| Cache/OTP/rate limit | Redis |
| Media storage/CDN | ImageKit |
| Email delivery | Brevo, Resend, Amazon SES, or similar |
| Payments | Razorpay production keys |

## 7. How Traffic Will Work

User visits:

`https://yourdomain.com`

Then:

1. Domain DNS points to KVM 2 server IP.
2. Nginx receives the HTTPS request.
3. Nginx forwards the request to the local Next.js app running on a private port.
4. Next.js handles public website, portals, and API routes.
5. API routes use PostgreSQL for database operations.
6. Redis is used for OTP, rate limiting, and temporary security state.
7. ImageKit serves uploaded media.
8. Email provider sends OTPs, credentials, invites, and communication emails.

## 8. Initial Server Setup Steps

After buying the VPS:

1. Select India location.
2. Install Ubuntu LTS.
3. Create a non-root deploy user.
4. Add SSH key login.
5. Disable root SSH login.
6. Disable password SSH login.
7. Enable UFW firewall.
8. Allow only required ports:
   - `22` for SSH.
   - `80` for HTTP.
   - `443` for HTTPS.
9. Install Fail2ban.
10. Enable unattended security updates.

## 9. Install Required Software

Install:

- Node.js LTS.
- npm.
- PostgreSQL.
- Redis.
- Nginx.
- PM2.
- Certbot.
- Git.

These services allow the app to build, run, store data, cache OTPs/rate limits, serve HTTPS traffic, and stay alive after server restart.

## 10. Database Setup

PostgreSQL will store:

- Superadmin users.
- Subadmins.
- Schools.
- Trusts.
- Students.
- Academic years.
- Standards.
- Alumni.
- Alumni posts.
- Events.
- School page content.
- Donations/projects.
- CSR inquiries.
- Monitoring logs.
- Email logs.

Setup steps:

1. Create production database.
2. Create production database user.
3. Use strong database password.
4. Allow database access only from localhost.
5. Add database URL to `.env`.
6. Run migration SQL files.
7. Import existing database if needed.
8. Verify tables and records.

## 11. Redis Setup

Redis will be used for:

- Login OTP storage.
- OTP expiry.
- Rate limiting.
- Temporary verification states.
- Security counters.

Redis should be bound to localhost only. It should not be exposed publicly.

This keeps OTP and rate-limit operations fast without overloading PostgreSQL.

## 12. Application Setup

Deployment steps:

1. Upload or clone the project code on the VPS.
2. Install dependencies with `npm install`.
3. Create production `.env` file.
4. Add database, Redis, email, ImageKit, Razorpay, JWT, and app URL environment variables.
5. Run `npm run build`.
6. Start the app with PM2.
7. Save PM2 process list.
8. Configure PM2 startup after reboot.

The Next.js app should run locally on a port such as `3000`. Nginx will proxy public traffic to that local port.

## 13. Nginx Setup

Nginx will:

- Receive public traffic.
- Handle domain routing.
- Forward requests to the Next.js app.
- Support HTTPS.
- Improve production stability.

Basic flow:

`Browser -> HTTPS -> Nginx -> localhost:3000 -> Next.js`

## 14. SSL Setup

Use Let’s Encrypt Certbot for free SSL.

SSL is required because:

- Login pages must be secure.
- OTP and password flows must be encrypted.
- Cookies must be secure.
- Payment/donation flows must use HTTPS.
- Public users should trust the website.

## 15. Environment Variables Required

Production `.env` should include:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- Email provider keys/settings.
- ImageKit public key.
- ImageKit private key.
- ImageKit URL endpoint.
- Razorpay key ID.
- Razorpay key secret.
- Any payment webhook secret.
- Any admin/support email settings.

The `.env` file must never be committed to Git.

## 16. ImageKit Usage

ImageKit will handle media uploads and delivery.

It will be used for:

- School images.
- Events gallery.
- Updates images.
- Alumni profile/media.
- Project images.
- Website media.

Using ImageKit helps because the VPS does not need to store and serve heavy files. This improves performance and saves disk space.

## 17. Email Provider Usage

Use a transactional email provider instead of personal Gmail SMTP.

Email will be used for:

- Superadmin login OTP.
- Subadmin login OTP.
- Alumni login OTP.
- Alumni reset password OTP.
- Alumni approval credentials.
- Alumni access reset credentials.
- Alumni invite emails.
- Google Meet link emails.
- CSR/donation communication where needed.

Recommended options:

- Brevo.
- Resend.
- Amazon SES.

## 18. Backup Plan

Backups are very important because this platform contains school, student, alumni, donation, and monitoring data.

Recommended backup layers:

1. Hostinger daily auto-backup.
2. PostgreSQL daily dump.
3. Store database dump outside the VPS.
4. Test restore before launch.
5. Keep at least 7 to 30 days of database backups.

The optional Hostinger daily auto-backup is recommended because VPS data loss would be serious.

## 19. Security Plan

Before production launch:

- Use SSH keys only.
- Disable root login.
- Enable firewall.
- Install Fail2ban.
- Keep PostgreSQL and Redis local only.
- Use HTTPS.
- Use secure cookies.
- Use strong secrets.
- Use Redis rate limiting.
- Use parameterized SQL.
- Sanitize/escape user content.
- Protect upload endpoints.
- Keep `.env` private.
- Keep server packages updated.
- Review logs regularly.

## 20. How We Will Use KVM 2 Day to Day

Daily usage:

- Admins use the platform through domain URL.
- Superadmin manages global data.
- Subadmin manages school data.
- Alumni use the alumni portal.
- Website visitors use the public site.
- PM2 keeps the app running.
- Nginx serves traffic.
- PostgreSQL stores data.
- Redis handles OTP/rate limiting.
- ImageKit handles media.
- Email provider sends emails.

Maintenance usage:

- Check PM2 app status.
- Check Nginx status.
- Check disk space.
- Check PostgreSQL backup.
- Check Redis status.
- Check SSL renewal.
- Check application logs.
- Deploy updates when code changes.

## 21. Deployment Update Flow

When new code is ready:

1. Pull latest code on VPS.
2. Install new dependencies if package files changed.
3. Run database migrations if added.
4. Run `npm run build`.
5. Restart PM2 app.
6. Check website and portals.
7. Check logs for errors.

This keeps deployment controlled and repeatable.

## 22. Production Readiness Checklist

Before going live:

- Domain connected.
- SSL active.
- App builds successfully.
- PostgreSQL connected.
- Redis connected.
- ImageKit upload works.
- Email OTP works.
- Superadmin login works.
- Subadmin login works.
- Alumni login works.
- Public website loads.
- Donation flow tested.
- Alumni approval flow tested.
- Monitoring logs tested.
- Backups configured.
- Restore tested.
- Firewall active.
- PM2 startup configured.
- Error logs checked.

## 23. Final Recommendation

KVM 2 is a good first production server for this platform because it gives enough control at a low cost. It can run the complete app stack if configured properly.

The most important condition is discipline:

- Secure the server.
- Keep backups.
- Use ImageKit for media.
- Use Redis for OTP and rate limiting.
- Keep database private.
- Monitor logs.
- Test after every deployment.

With this setup, KVM 2 can support the first production phase of Madni Education Platform nicely and cost-effectively.

