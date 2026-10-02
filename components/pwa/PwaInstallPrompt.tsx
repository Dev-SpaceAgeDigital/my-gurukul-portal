'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, X, Smartphone, Shield, GraduationCap, Building2 } from 'lucide-react';

interface RoleTheme {
  containerBg: string;
  borderColor: string;
  glowColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeTextColor: string;
  badgeIcon: React.ReactNode;
  badgeText: string;
  titleSuffix: string;
  installBtn: string;
}

const THEMES: Record<string, RoleTheme> = {
  SUPER_ADMIN: {
    containerBg: 'bg-gradient-to-br from-[#0b1525] via-[#112240] to-[#16325c]',
    borderColor: 'border-[#3f72af]/40 shadow-[0_20px_50px_rgba(11,21,37,0.6)]',
    glowColor: 'bg-[#3f72af]/30',
    badgeBg: 'bg-[#3f72af]/20',
    badgeBorder: 'border-[#3f72af]/40',
    badgeTextColor: 'text-[#93c5fd]',
    badgeIcon: <Shield size={11} className="text-amber-400" />,
    badgeText: 'Executive Governance',
    titleSuffix: 'Superadmin Portal',
    installBtn: 'bg-gradient-to-r from-[#3f72af] via-[#4d86c8] to-[#93c5fd] text-white font-extrabold shadow-lg shadow-[#3f72af]/30',
  },
  SUB_ADMIN: {
    containerBg: 'bg-gradient-to-br from-[#064e3b] via-[#042f2e] to-[#0f3b39]',
    borderColor: 'border-emerald-500/40 shadow-[0_20px_50px_rgba(4,47,46,0.6)]',
    glowColor: 'bg-emerald-400/25',
    badgeBg: 'bg-emerald-500/20',
    badgeBorder: 'border-emerald-400/40',
    badgeTextColor: 'text-[#6ee7b7]',
    badgeIcon: <Building2 size={11} className="text-emerald-300" />,
    badgeText: 'School Management',
    titleSuffix: 'School Officer App',
    installBtn: 'bg-gradient-to-r from-emerald-400 via-teal-400 to-teal-300 text-slate-950 font-black shadow-lg shadow-emerald-950/40',
  },
  ALUMNI: {
    containerBg: 'bg-gradient-to-br from-[#1e1b4b] via-[#2e1065] to-[#1e293b]',
    borderColor: 'border-violet-500/40 shadow-[0_20px_50px_rgba(30,27,75,0.6)]',
    glowColor: 'bg-violet-400/30',
    badgeBg: 'bg-violet-500/20',
    badgeBorder: 'border-violet-400/40',
    badgeTextColor: 'text-[#d8b4fe]',
    badgeIcon: <GraduationCap size={11} className="text-violet-300" />,
    badgeText: 'Alumni Network',
    titleSuffix: 'Alumni Network App',
    installBtn: 'bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-300 text-slate-950 font-black shadow-lg shadow-violet-950/40',
  },
  DEFAULT: {
    containerBg: 'bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0b1525]',
    borderColor: 'border-sky-500/40 shadow-[0_20px_50px_rgba(15,23,42,0.6)]',
    glowColor: 'bg-sky-400/25',
    badgeBg: 'bg-sky-500/20',
    badgeBorder: 'border-sky-400/40',
    badgeTextColor: 'text-[#7dd3fc]',
    badgeIcon: <Smartphone size={11} className="text-sky-300" />,
    badgeText: 'Mobile Portal',
    titleSuffix: 'App',
    installBtn: 'bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 text-slate-950 font-black shadow-lg shadow-sky-950/40',
  },
};

export default function PwaInstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [role, setRole] = useState<'SUPER_ADMIN' | 'SUB_ADMIN' | 'ALUMNI' | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    // Register SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Fetch User Role & Tenant Info (Authenticated or URL Domain-based)
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.role) {
          setRole(data.role);
          setUserData(data);
        } else {
          // Unauthenticated visitor: Fallback to domain-based public tenant resolver
          fetch('/api/public/tenant-info')
            .then((r) => r.json())
            .then((tData) => {
              if (tData?.success) {
                setUserData({
                  schoolName: tData.tenantType === 'SCHOOL' ? tData.name : null,
                  trustName: tData.trustName || tData.name,
                  logoUrl: tData.logoUrl,
                });
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        fetch('/api/public/tenant-info')
          .then((r) => r.json())
          .then((tData) => {
            if (tData?.success) {
              setUserData({
                schoolName: tData.tenantType === 'SCHOOL' ? tData.name : null,
                trustName: tData.trustName || tData.name,
                logoUrl: tData.logoUrl,
              });
            }
          })
          .catch(() => {});
      });

    // Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!mounted || !showPrompt) return null;

  const tenantName = userData?.schoolName || userData?.trustName || 'My Gurukul';
  const logoUrl = userData?.logoUrl || '/my-gurukul.png';

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const effectiveRole =
    role ||
    (currentPath.startsWith('/superadmin')
      ? 'SUPER_ADMIN'
      : currentPath.startsWith('/subadmin')
      ? 'SUB_ADMIN'
      : currentPath.startsWith('/alumni')
      ? 'ALUMNI'
      : 'DEFAULT');

  const currentTheme = THEMES[effectiveRole] || THEMES.DEFAULT;
  const appTitle = `${tenantName} ${currentTheme.titleSuffix}`;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[999] animate-in slide-in-from-bottom-5 duration-300">
      <div
        className={`${currentTheme.containerBg} ${currentTheme.borderColor} text-white p-4 rounded-2xl shadow-2xl border backdrop-blur-md relative overflow-hidden group transition-all duration-300`}
      >
        {/* Ambient Glow */}
        <div
          className={`absolute -right-8 -top-8 w-24 h-24 ${currentTheme.glowColor} rounded-full blur-xl group-hover:scale-150 transition-transform duration-500`}
        />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            {/* Dynamic School / Trust Logo Image */}
            <div className="w-12 h-12 rounded-xl bg-white/95 p-1 flex items-center justify-center border border-white/20 shadow-md shrink-0 relative overflow-hidden">
              <Image src={logoUrl} alt="Logo" width={44} height={44} className="object-contain" priority />
            </div>

            <div className="min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md ${currentTheme.badgeBg} ${currentTheme.badgeTextColor} ${currentTheme.badgeBorder} border text-[10px] font-bold tracking-wide uppercase mb-1 shadow-sm`}
              >
                {currentTheme.badgeIcon}
                <span>{currentTheme.badgeText}</span>
              </span>
              <h4 className="text-sm font-bold text-white leading-tight truncate">{appTitle}</h4>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                Add to your home screen for 1-tap access & push alerts!
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPrompt(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-3.5 flex items-center gap-2 relative z-10">
          <button
            onClick={handleInstallClick}
            className={`flex-1 py-2 px-3 rounded-xl ${currentTheme.installBtn} text-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer`}
          >
            <Download size={14} className="stroke-[3]" />
            <span>Add to Home Screen</span>
          </button>

          <button
            onClick={() => setShowPrompt(false)}
            className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer border border-white/10"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
