'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StandardManagement from '@/components/dashboard/sub-admin/StandardManagement';
import StudentImport from '@/components/dashboard/sub-admin/StudentImport';

export default function SubAdminAcademicPage() {
  const [activeTab, setActiveTab] = useState<'standards' | 'admissions'>('standards');
  return (
    <DashboardLayout title="Academic" role="SUB_ADMIN" activeItem="Academic">
      <div className="py-4 lg:h-full lg:overflow-hidden flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-md border border-slate-200 shadow-sm shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Academic Records</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Grade Structures & Student Intake</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-md overflow-x-auto custom-scrollbar">
            <button onClick={() => setActiveTab('standards')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${activeTab === 'standards' ? 'bg-[#18181b] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Standards list
            </button>
            <button onClick={() => setActiveTab('admissions')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${activeTab === 'admissions' ? 'bg-[#18181b] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Student Admissions
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 lg:overflow-hidden">
          {activeTab === 'standards' ? <StandardManagement /> : <StudentImport />}
        </div>
      </div>
    </DashboardLayout>
  );
}
