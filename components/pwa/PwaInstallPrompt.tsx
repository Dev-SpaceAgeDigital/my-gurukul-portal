'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, X, Smartphone, Sparkles, Shield, GraduationCap, Building2 } from 'lucide-react';

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
                  logoUrl: tData.logoUrl
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
                logoUrl: tData.logoUrl
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
  const effectiveRole = role || (currentPath.startsWith('/subadmin') ? 'SUB_ADMIN' : currentPath.startsWith('/alumni') ? 'ALUMNI' : currentPath.startsWith('/superadmin') ? 'SUPER_ADMIN' : null);

  const appTitle =
    effectiveRole === 'SUPER_ADMIN'
      ? `${tenantName} Superadmin Portal`
      : effectiveRole === 'SUB_ADMIN'
      ? `${tenantName} School Officer App`
      : effectiveRole === 'ALUMNI'
      ? `${tenantName} Alumni Network App`
      : `${tenantName} App`;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[999] animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-gradient-to-br from-[#1b4a50] via-[#143d43] to-[#0d2a4a] text-white p-4 rounded-2xl shadow-2xl border border-teal-500/30 backdrop-blur-md relative overflow-hidden group">
        {/* Background glow */}
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-teal-400/20 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            {/* Dynamic School / Trust Logo Image */}
            <div className="w-12 h-12 rounded-xl bg-white/90 p-1 flex items-center justify-center border border-white/20 shadow-md shrink-0 relative overflow-hidden">
              <Image src={logoUrl} alt="Logo" width={44} height={44} className="object-contain" priority />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-[#AAFFC7] text-[10px] font-bold tracking-wide uppercase border border-white/10 mb-1">
                {effectiveRole === 'SUPER_ADMIN' ? (
                  <>
                    <Shield size={11} className="text-amber-400" />
                    <span>Executive Access</span>
                  </>
                ) : effectiveRole === 'SUB_ADMIN' ? (
                  <>
                    <Building2 size={11} className="text-teal-300" />
                    <span>School Management</span>
                  </>
                ) : effectiveRole === 'ALUMNI' ? (
                  <>
                    <GraduationCap size={11} className="text-emerald-300" />
                    <span>Alumni Network</span>
                  </>
                ) : (
                  <>
                    <Smartphone size={11} />
                    <span>My Gurukul App</span>
                  </>
                )}
              </span>
              <h4 className="text-sm font-bold text-white leading-tight">{appTitle}</h4>
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
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black text-xs shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download size={14} className="stroke-[3]" />
            <span>Add to Home Screen</span>
          </button>

          <button
            onClick={() => setShowPrompt(false)}
            className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
