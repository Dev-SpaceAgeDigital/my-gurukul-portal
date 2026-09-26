'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import NeedyAnalytics from '@/components/dashboard/sub-admin/NeedyAnalytics';
import CostManagement from '@/components/dashboard/sub-admin/CostManagement';

export default function SubAdminAccountsPage() {
  const [activeTab, setActiveTab] = useState<'sponsorships' | 'projects'>('sponsorships');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'projects') setActiveTab('projects');
  }, []);
  return (
    <DashboardLayout title="Accounts" role="SUB_ADMIN" activeItem="Accounts">
      <div className="py-4 lg:h-full lg:overflow-hidden flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-md border border-slate-200 shadow-sm shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Accounts Hub</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Trust Fund & Project Management</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-md">
            <button onClick={() => setActiveTab('sponsorships')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'sponsorships' ? 'bg-[#18181b] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Sponsorships
            </button>
            <button onClick={() => setActiveTab('projects')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'projects' ? 'bg-[#18181b] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Projects
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 lg:overflow-hidden">
          {activeTab === 'sponsorships' ? <NeedyAnalytics /> : <CostManagement />}
        </div>
      </div>
    </DashboardLayout>
  );
}
