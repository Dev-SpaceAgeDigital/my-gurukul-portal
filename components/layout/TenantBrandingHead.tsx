'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface TenantData {
  name: string;
  logoUrl: string;
  trustName?: string;
}

let cachedTenantInfo: TenantData | null = null;

export default function TenantBrandingHead() {
  const pathname = usePathname();
  const [tenantInfo, setTenantInfo] = useState<TenantData | null>(cachedTenantInfo);

  useEffect(() => {
    if (cachedTenantInfo) {
      applyBranding(cachedTenantInfo, pathname);
      return;
    }

    fetch('/api/public/tenant-info')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          const info: TenantData = {
            name: data.name || data.trustName || 'Educational Institution',
            logoUrl: data.logoUrl || '/my-gurukul.png',
            trustName: data.trustName,
          };
          cachedTenantInfo = info;
          setTenantInfo(info);
          applyBranding(info, pathname);
        }
      })
      .catch(() => {});
  }, [pathname]);

  return null;
}

function applyBranding(tenant: TenantData, path: string) {
  if (typeof document === 'undefined') return;

  const tenantName = tenant.name || 'Institution';
  const logoUrl = tenant.logoUrl;

  // Determine Tab Title based on active route
  let pageTitle = tenantName;

  if (path.startsWith('/alumni')) {
    if (path.includes('/login')) {
      pageTitle = `${tenantName} - Alumni Login`;
    } else if (path.includes('/register')) {
      pageTitle = `${tenantName} - Alumni Registration`;
    } else if (path.includes('/dashboard')) {
      pageTitle = `${tenantName} - Alumni Hub`;
    } else if (path.includes('/give-back') || path.includes('/donations')) {
      pageTitle = `${tenantName} - Alumni Giving Back`;
    } else if (path.includes('/find-alumni')) {
      pageTitle = `${tenantName} - Find Alumni Directory`;
    } else {
      const segment = path.replace('/alumni/', '').replace(/[-_]/g, ' ');
      const cleanSegment = segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : 'Alumni Hub';
      pageTitle = `${tenantName} - ${cleanSegment}`;
    }
  } else if (path.startsWith('/subadmin')) {
    if (path.includes('/login')) {
      pageTitle = `${tenantName} - School Admin Login`;
    } else if (path.includes('/dashboard')) {
      pageTitle = `${tenantName} - School Dashboard`;
    } else {
      const segment = path.replace('/subadmin/', '').replace(/[-_]/g, ' ');
      const cleanSegment = segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : 'School Portal';
      pageTitle = `${tenantName} - ${cleanSegment}`;
    }
  } else if (path.startsWith('/superadmin')) {
    if (path.includes('/login')) {
      pageTitle = `${tenantName} - Superadmin Login`;
    } else if (path.includes('/dashboard')) {
      pageTitle = `${tenantName} - Governance Console`;
    } else {
      const segment = path.replace('/superadmin/', '').replace(/[-_]/g, ' ');
      const cleanSegment = segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : 'Governance Portal';
      pageTitle = `${tenantName} - ${cleanSegment}`;
    }
  } else if (path === '/' || path === '') {
    pageTitle = `${tenantName} - Institutional Portal`;
  }

  // Determine portal scope for PWA manifest & smart launcher
  let portalParam = '';
  if (path.startsWith('/alumni')) {
    portalParam = 'alumni';
  } else if (path.startsWith('/subadmin')) {
    portalParam = 'subadmin';
  } else if (path.startsWith('/superadmin')) {
    portalParam = 'superadmin';
  }

  if (portalParam) {
    try {
      document.cookie = `preferred_portal=${portalParam}; Path=/; Max-Age=31536000; SameSite=Lax`;
      localStorage.setItem('preferred_portal', portalParam);
    } catch {}
  }

  // Update Favicons and Manifest dynamically
  if (logoUrl) {
    updateLinkTag('icon', logoUrl);
    updateLinkTag('shortcut icon', logoUrl);
    updateLinkTag('apple-touch-icon', logoUrl);
    const manifestHref = portalParam ? `/manifest.json?portal=${portalParam}` : '/manifest.json';
    updateLinkTag('manifest', manifestHref);
  }
}

function updateLinkTag(rel: string, href: string) {
  try {
    let link: HTMLLinkElement | null = document.querySelector(`link[rel='${rel}']`);
    if (link) {
      link.href = href;
    } else {
      link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      document.head.appendChild(link);
    }
  } catch {}
}
