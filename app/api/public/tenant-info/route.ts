import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { withPublicApi } from '@/lib/public-api';

export const dynamic = 'force-dynamic';

export const GET = withPublicApi(async (req) => {
  try {
    const url = new URL(req.url);
    const hostParam = url.searchParams.get('host');
    
    // Read caller host from header or query param
    const rawHost = hostParam || req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
    const cleanHost = rawHost.split(':')[0].toLowerCase().trim(); // Remove port if dev
    const nakedHost = cleanHost.replace(/^portal\./, '').replace(/^www\./, '');
    const subdomainSlug = cleanHost.split('.')[0];

    // Default fallback contacts
    const defaultContacts = {
      schoolPhone: '+91 98200 12345',
      schoolEmail: 'admin@mygurukul.org',
      schoolAddress: 'Campus Administration Office',
      trustPhone: '+91 98200 54321',
      trustEmail: 'trust@mygurukul.org',
    };

    if (!cleanHost || cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
      // Fetch the first active school & trust in the database for localhost testing
      const defaultSchoolRes = await pool.query(
        `SELECT s.id as "schoolId", s."schoolName", s."logoUrl" as "schoolLogo", s."phoneNo" as "schoolPhone", s.email as "schoolEmail", s.address as "schoolAddress",
                t.id as "trustId", t."trustName", t."logoUrl" as "trustLogo", t."presidentNo" as "trustPhone", t."primaryColor"
         FROM "School" s
         LEFT JOIN "Trust" t ON s."trustId" = t.id
         LIMIT 1`
      ).catch(() => ({ rows: [] }));

      if (defaultSchoolRes.rows.length > 0) {
        const row = defaultSchoolRes.rows[0];
        return NextResponse.json({
          success: true,
          tenantType: 'SCHOOL',
          schoolId: row.schoolId,
          trustId: row.trustId,
          name: row.schoolName,
          logoUrl: row.schoolLogo || row.trustLogo || '/my-gurukul.png',
          primaryColor: row.primaryColor || '#0f172a',
          trustName: row.trustName || 'EduTrust Network',
          customDomain: cleanHost,
          schoolPhone: row.schoolPhone || defaultContacts.schoolPhone,
          schoolEmail: row.schoolEmail || defaultContacts.schoolEmail,
          schoolAddress: row.schoolAddress || defaultContacts.schoolAddress,
          trustPhone: row.trustPhone || defaultContacts.trustPhone,
          trustEmail: defaultContacts.trustEmail,
        });
      }

      // Default fallback info for local development
      return NextResponse.json({
        success: true,
        tenantType: 'PLATFORM',
        name: 'My Gurukul Platform',
        logoUrl: '/my-gurukul.png',
        primaryColor: '#0f172a',
        trustName: 'EduTrust Network',
        customDomain: cleanHost,
        ...defaultContacts,
      });
    }

    // 1. First check if domain matches a School record
    const schoolRes = await pool.query(
      `SELECT s.id as "schoolId", s."schoolName", s."logoUrl" as "schoolLogo", s."customDomain", s."subdomain", s."trustId",
              s."phoneNo" as "schoolPhone", s.email as "schoolEmail", s.address as "schoolAddress",
              t."trustName", t."logoUrl" as "trustLogo", t."presidentNo" as "trustPhone", t."primaryColor",
              t."is80GEnabled", t."taxExemptionNo", t."min80GAmount"
       FROM "School" s
       LEFT JOIN "Trust" t ON s."trustId" = t.id
       WHERE LOWER(s."customDomain") IN ($1, $2) 
          OR LOWER(s."subdomain") IN ($1, $3) 
          OR s.id::text = $1`,
      [cleanHost, nakedHost, subdomainSlug]
    );

    if (schoolRes.rows.length > 0) {
      const row = schoolRes.rows[0];
      return NextResponse.json({
        success: true,
        tenantType: 'SCHOOL',
        schoolId: row.schoolId,
        trustId: row.trustId,
        name: row.schoolName,
        logoUrl: row.schoolLogo || row.trustLogo || '/my-gurukul.png',
        primaryColor: row.primaryColor || '#0f172a',
        trustName: row.trustName || 'Trust Network',
        customDomain: row.customDomain || cleanHost,
        schoolPhone: row.schoolPhone || defaultContacts.schoolPhone,
        schoolEmail: row.schoolEmail || defaultContacts.schoolEmail,
        schoolAddress: row.schoolAddress || defaultContacts.schoolAddress,
        trustPhone: row.trustPhone || defaultContacts.trustPhone,
        trustEmail: defaultContacts.trustEmail,
        is80GEnabled: Boolean(row.is80GEnabled),
        taxExemptionNo: row.taxExemptionNo || null,
        min80GAmount: row.min80GAmount ? Number(row.min80GAmount) : 500,
      });
    }

    // 2. Next check if domain matches a Trust record
    const trustRes = await pool.query(
      `SELECT id as "trustId", "trustName", "logoUrl", "primaryColor", "customDomain", "slug",
              "presidentNo" as "trustPhone",
              "is80GEnabled", "taxExemptionNo", "min80GAmount"
       FROM "Trust"
       WHERE LOWER("customDomain") IN ($1, $2) 
          OR LOWER("slug") IN ($1, $3) 
          OR id::text = $1`,
      [cleanHost, nakedHost, subdomainSlug]
    );

    if (trustRes.rows.length > 0) {
      const row = trustRes.rows[0];
      return NextResponse.json({
        success: true,
        tenantType: 'TRUST',
        trustId: row.trustId,
        name: row.trustName,
        logoUrl: row.logoUrl || '/my-gurukul.png',
        primaryColor: row.primaryColor || '#0f172a',
        trustName: row.trustName,
        customDomain: row.customDomain || cleanHost,
        trustPhone: row.trustPhone || defaultContacts.trustPhone,
        trustEmail: defaultContacts.trustEmail,
        is80GEnabled: Boolean(row.is80GEnabled),
        taxExemptionNo: row.taxExemptionNo || null,
        min80GAmount: row.min80GAmount ? Number(row.min80GAmount) : 500,
      });
    }

    // Default fallback if domain not registered yet
    return NextResponse.json({
      success: true,
      tenantType: 'UNREGISTERED',
      name: 'My Gurukul Platform',
      logoUrl: '/my-gurukul.png',
      primaryColor: '#0f172a',
      trustName: 'My Gurukul Network',
      customDomain: cleanHost,
      ...defaultContacts,
    });

  } catch (error: any) {
    console.error('Public tenant-info resolution error:', error);
    return NextResponse.json({
      success: true,
      tenantType: 'FALLBACK',
      name: 'My Gurukul Platform',
      logoUrl: '/my-gurukul.png',
      primaryColor: '#0f172a',
      trustName: 'My Gurukul Network',
      customDomain: '',
      schoolPhone: '+91 98200 12345',
      schoolEmail: 'admin@mygurukul.org',
      trustPhone: '+91 98200 54321',
      trustEmail: 'trust@mygurukul.org',
    });
  }
}, { cacheSeconds: 0 });
