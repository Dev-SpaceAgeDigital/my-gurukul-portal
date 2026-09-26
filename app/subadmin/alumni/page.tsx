'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AlumniManagement from '@/components/dashboard/super-admin/AlumniManagement';
import AlumniInteractionManager from '@/components/dashboard/sub-admin/AlumniInteractionManager';
import AlumniRegistrationRequests from '@/components/dashboard/sub-admin/AlumniRegistrationRequests';

export default function SubAdminAlumniPage() {
  const [activeTab, setActiveTab] = useState<'profiles' | 'interactions' | 'requests'>('profiles');
  return (
    <DashboardLayout title="Alumni" role="SUB_ADMIN" activeItem="Alumni">
      <div className="py-4 lg:h-full lg:overflow-hidden flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-md border border-slate-200 shadow-sm shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Alumni Hub</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Unified Network Management</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-md">
            <button onClick={() => setActiveTab('profiles')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'profiles' ? 'bg-[#18181b] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Profiles
            </button>
            <button onClick={() => setActiveTab('interactions')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'interactions' ? 'bg-[#18181b] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Interactions
            </button>
            <button onClick={() => setActiveTab('requests')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'requests' ? 'bg-[#18181b] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Registration Requests
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 lg:overflow-hidden">
          {activeTab === 'profiles' ? <AlumniManagement /> : activeTab === 'interactions' ? <AlumniInteractionManager /> : <AlumniRegistrationRequests />}
        </div>
      </div>
    </DashboardLayout>
  );
}
