'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Activity,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Filter,
  Shield,
} from 'lucide-react';

type MonitoringItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  actorRole?: string | null;
  schoolName?: string | null;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

type MonitoringResponse = {
  grouped: {
    today: MonitoringItem[];
    yesterday: MonitoringItem[];
    older: MonitoringItem[];
  };
  counts: {
    total: number;
    unread: number;
    byType: Record<string, number>;
  };
};

const typeOptions = ['ALL', 'DONATION', 'MONITORING', 'CONTENT', 'CAREER', 'ACTION'];
const priorityOptions = ['ALL', 'HIGH', 'NORMAL', 'LOW'];

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function typeColor(type: string) {
  switch (type) {
    case 'DONATION':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'MONITORING':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'CONTENT':
      return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'CAREER':
      return 'bg-violet-50 text-violet-700 border-violet-100';
    case 'ACTION':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100';
  }
}

function ActivityGroup({ title, subtitle, icon, items }: { title: string; subtitle: string; icon: React.ReactNode; items: MonitoringItem[] }) {
  return (
    <section className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0b1525] text-white flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-3 py-1">{items.length}</span>
      </div>

      <div className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">No activity found</div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.link) window.location.href = item.link;
              }}
              className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${typeColor(item.type)}`}>{item.type}</span>
                    {item.priority === 'HIGH' && <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-full px-2 py-0.5">HIGH</span>}
                    {!item.isRead && <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">NEW</span>}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                  <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-slate-400">
                    {item.actorRole && <span>Actor: {item.actorRole.replace('_', ' ')}</span>}
                    {item.schoolName && <span>School: {item.schoolName}</span>}
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-400 shrink-0">{formatTime(item.createdAt)}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

export default function SuperAdminMonitoringPage() {
  const [data, setData] = useState<MonitoringResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('ALL');
  const [priority, setPriority] = useState('ALL');

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set('type', type);
    params.set('priority', priority);
    return params.toString();
  }, [type, priority]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/superadmin/monitoring?${query}`, { cache: 'no-store' });
        const payload = await response.json();
        if (active && response.ok) setData(payload);
      } catch {
        if (active) setData(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [query]);

  const counts = data?.counts || { total: 0, unread: 0, byType: {} };
  const grouped = data?.grouped || { today: [], yesterday: [], older: [] };

  return (
    <DashboardLayout title="Monitoring" role="SUPER_ADMIN" activeItem="Monitoring">
      <div className="space-y-6 max-w-7xl mx-auto py-4">
        <div className="bg-[#0b1525] text-white rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-xl shadow-slate-900/10">
          <div>
            <div className="flex items-center gap-2 text-blue-100 text-xs font-bold mb-2">
              <Shield size={15} />
              <span>Central monitoring</span>
            </div>
            <h1 className="text-xl font-bold">Portal activity timeline</h1>
            <p className="text-sm text-slate-300 mt-1">Track what happened today, yesterday, and across recent portal actions.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-[10px] text-slate-300 font-bold">Total</p>
              <p className="text-2xl font-bold">{counts.total}</p>
            </div>
            <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-[10px] text-slate-300 font-bold">Unread</p>
              <p className="text-2xl font-bold">{counts.unread}</p>
            </div>
            <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-3 col-span-2 sm:col-span-1">
              <p className="text-[10px] text-slate-300 font-bold">Today</p>
              <p className="text-2xl font-bold">{grouped.today.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Filter size={16} className="text-slate-400" />
            <span>Filters</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={type} onChange={(event) => setType(event.target.value)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none">
              {typeOptions.map((option) => <option key={option} value={option}>{option === 'ALL' ? 'All types' : option}</option>)}
            </select>
            <select value={priority} onChange={(event) => setPriority(event.target.value)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none">
              {priorityOptions.map((option) => <option key={option} value={option}>{option === 'ALL' ? 'All priorities' : option}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-100 rounded-2xl py-24 flex flex-col items-center justify-center text-slate-400">
            <Activity size={32} className="animate-spin mb-3" />
            <p className="text-sm font-semibold">Loading monitoring activity...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            <ActivityGroup title="Happening today" subtitle="Actions recorded since midnight" icon={<Bell size={18} />} items={grouped.today} />
            <ActivityGroup title="Happened yesterday" subtitle="Previous day activity" icon={<Clock3 size={18} />} items={grouped.yesterday} />
            <ActivityGroup title="Earlier activity" subtitle="Recent records before yesterday" icon={<CalendarClock size={18} />} items={grouped.older} />
          </div>
        )}

        {!loading && counts.total === 0 && (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <CheckCircle2 size={15} />
            <span>No matching monitoring records yet.</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
