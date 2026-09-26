'use client';

import React, { useState } from 'react';
import { CalendarDays, FileText, Newspaper } from 'lucide-react';
import NewsUpdatesManager from '@/components/dashboard/shared/NewsUpdatesManager';
import EventGallery from '@/components/dashboard/sub-admin/EventGallery';
import SchoolPageManager from '@/components/dashboard/sub-admin/SchoolPageManager';

type SchoolHubTab = 'school-page' | 'updates' | 'events';

interface SchoolHubManagerProps {
  schoolId: string;
  initialTab?: SchoolHubTab;
}

const tabs: Array<{
  id: SchoolHubTab;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: 'school-page', label: 'School Page', icon: <FileText size={16} /> },
  { id: 'updates', label: 'Updates', icon: <Newspaper size={16} /> },
  { id: 'events', label: 'Events', icon: <CalendarDays size={16} /> },
];

export default function SchoolHubManager({ schoolId, initialTab = 'school-page' }: SchoolHubManagerProps) {
  const [activeTab, setActiveTab] = useState<SchoolHubTab>(initialTab);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="mx-auto w-full max-w-3xl rounded-lg border border-[#E6DFD3] bg-white/75 p-2 shadow-sm">
        <div className="grid grid-cols-3 gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold transition-all sm:text-sm ${
                  isActive
                    ? 'bg-[#18181b] text-white shadow-sm'
                    : 'text-slate-700 hover:bg-[#EFECE5] hover:text-slate-950'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {activeTab === 'school-page' && <SchoolPageManager />}
        {activeTab === 'updates' && <NewsUpdatesManager role="SUB_ADMIN" />}
        {activeTab === 'events' && <EventGallery schoolId={schoolId} />}
      </div>
    </div>
  );
}
