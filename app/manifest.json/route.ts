import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const rawHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
    const cleanHost = rawHost.split(':')[0].toLowerCase().trim();
    const nakedHost = cleanHost.replace(/^portal\./, '').replace(/^www\./, '');
    const subdomainSlug = cleanHost.split('.')[0];

    let tenantName = 'My Gurukul Platform';
    let shortName = 'My Gurukul';
    let logoUrl = '/android-chrome-512x512.png';
    let primaryColor = '#0f172a';

    if (cleanHost && cleanHost !== 'localhost' && cleanHost !== '127.0.0.1') {
      // 1. Check School record
      const schoolRes = await pool.query(
        `SELECT s."schoolName", s."logoUrl" as "schoolLogo", t."trustName", t."logoUrl" as "trustLogo", t."primaryColor"
         FROM "School" s
         LEFT JOIN "Trust" t ON s."trustId" = t.id
         WHERE LOWER(s."customDomain") IN ($1, $2) 
            OR LOWER(s."subdomain") IN ($1, $3)`,
        [cleanHost, nakedHost, subdomainSlug]
      );

      if (schoolRes.rows.length > 0) {
        const row = schoolRes.rows[0];
        tenantName = row.schoolName || row.trustName || 'Educational Institution';
        shortName = (row.schoolName || row.trustName || 'Institution').slice(0, 20);
        logoUrl = row.schoolLogo || row.trustLogo || '/android-chrome-512x512.png';
        primaryColor = row.primaryColor || '#0f172a';
      } else {
        // 2. Check Trust record
        const trustRes = await pool.query(
          `SELECT "trustName", "logoUrl", "primaryColor"
           FROM "Trust"
           WHERE LOWER("customDomain") IN ($1, $2) 
              OR LOWER("slug") IN ($1, $3)`,
          [cleanHost, nakedHost, subdomainSlug]
        );

        if (trustRes.rows.length > 0) {
          const row = trustRes.rows[0];
          tenantName = row.trustName || 'Educational Trust';
          shortName = (row.trustName || 'Trust Portal').slice(0, 20);
          logoUrl = row.logoUrl || '/android-chrome-512x512.png';
          primaryColor = row.primaryColor || '#0f172a';
        }
      }
    }

    const manifestData = {
      name: `${tenantName} Portal`,
      short_name: shortName,
      description: `${tenantName} Institutional, Alumni & Governance System`,
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait-primary',
      background_color: '#ffffff',
      theme_color: primaryColor,
      icons: [
        {
          src: logoUrl,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: logoUrl,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
      ],
      shortcuts: [
        {
          name: `${shortName} Alumni Hub`,
          short_name: 'Alumni',
          description: 'Access Alumni Portal, Directory & Impact',
          url: '/alumni/dashboard',
          icons: [{ src: logoUrl, sizes: '192x192' }],
        },
        {
          name: `${shortName} School Admin`,
          short_name: 'School',
          description: 'Access School Management Console',
          url: '/subadmin/dashboard',
          icons: [{ src: logoUrl, sizes: '192x192' }],
        },
        {
          name: `${shortName} SuperAdmin`,
          short_name: 'SuperAdmin',
          description: 'Access Executive Governance & Command Center',
          url: '/superadmin/dashboard',
          icons: [{ src: logoUrl, sizes: '192x192' }],
        },
      ],
    };

    return new NextResponse(JSON.stringify(manifestData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (error) {
    console.error('Dynamic manifest error:', error);
    const fallbackManifest = {
      name: 'Institutional Portal',
      short_name: 'Portal',
      description: 'Institutional & Alumni Governance Portal',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#0f172a',
      icons: [
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
      ],
    };
    return new NextResponse(JSON.stringify(fallbackManifest), {
      status: 200,
      headers: { 'Content-Type': 'application/manifest+json' },
    });
  }
}
