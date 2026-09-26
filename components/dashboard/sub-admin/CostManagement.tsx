'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Calendar,
  Construction,
  Edit3,
  IndianRupee,
  Loader2,
  PartyPopper,
  PlayCircle,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface Expense {
  id: string;
  title: string;
  description: string | null;
  type: 'CONSTRUCTION' | 'EVENT';
  startDate: string | null;
  estimatedCost: string | number;
  paidAmount: string | number;
  mediaUrl: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | null;
  createdAt: string;
}

export default function CostManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { dialog, confirmDialog, showAlert } = usePortalDialog();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subadmin/costs');
      if (res.ok) {
        setExpenses(await res.json());
      } else {
        showAlert({ title: 'Load failed', message: 'Failed to load institutional costs.', variant: 'danger' });
      }
    } catch {
      showAlert({ title: 'Communication failed', message: 'Failed to load institutional costs.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog({
      title: 'Remove this project?',
      message: 'This project entry will be removed from the school records.',
      confirmText: 'Remove project',
      variant: 'danger',
    }))) return;

    try {
      const res = await fetch(`/api/subadmin/costs?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove project');
      await fetchExpenses();
      showAlert({ title: 'Project removed', message: 'The project has been removed from accounts.', variant: 'success' });
    } catch {
      showAlert({ title: 'Remove failed', message: 'The project could not be removed.', variant: 'danger' });
    }
  };

  const totalEstimated = expenses.reduce((sum, exp) => sum + parseFloat(exp.estimatedCost as string || '0'), 0);
  const totalPaid = expenses.reduce((sum, exp) => sum + parseFloat(exp.paidAmount as string || '0'), 0);

  const getCostProgress = (exp: Expense) => {
    const estimated = parseFloat(exp.estimatedCost as string || '0');
    const paid = parseFloat(exp.paidAmount as string || '0');
    if (!Number.isFinite(estimated) || estimated <= 0) return 0;
    if (!Number.isFinite(paid) || paid <= 0) return 0;
    return Math.min(100, Math.round((paid / estimated) * 100));
  };

  const getEstimatedCost = (exp: Expense) => {
    const estimated = parseFloat(exp.estimatedCost as string || '0');
    return Number.isFinite(estimated) ? estimated : 0;
  };

  return (
    <>
      <div className="lg:h-full lg:overflow-hidden flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0">
          <StatCard icon={<PartyPopper size={18} />} tone="amber" label="Project Registry" value="Institutional audit flow" />
          <StatCard icon={<ArrowUpRight size={18} />} tone="dark" label="Calculated Exposure" value={`Rs. ${totalEstimated.toLocaleString('en-IN')}`} />
          <StatCard icon={<IndianRupee size={18} />} tone="emerald" label="Settled Amount" value={`Rs. ${totalPaid.toLocaleString('en-IN')}`} />
          <StatCard icon={<Construction size={18} />} tone="rose" label="Remaining Liquidity" value={`Rs. ${(totalEstimated - totalPaid).toLocaleString('en-IN')}`} />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-5 py-3 rounded-md border border-slate-200 shadow-sm shrink-0">
          <div className="relative group w-full sm:w-80">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#dac48b] transition-colors" />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100/80 border border-slate-200/60 rounded-md outline-none focus:ring-2 focus:ring-[#dac48b]/20 focus:bg-white text-xs transition-all"
            />
          </div>
          <Link
            href="/subadmin/accounts/projects/new"
            className="flex items-center space-x-2 bg-[#18181b] text-white px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-black transition-all active:scale-[0.98] shrink-0"
          >
            <Plus size={16} />
            <span>Add New Project</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-white rounded-md border border-slate-100 shadow-sm">
            <Loader2 className="animate-spin text-[#dac48b]" size={32} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Syncing Institutional Data...</p>
          </div>
        ) : (
          <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
            <div className="overflow-auto custom-scrollbar flex-1">
              <table className="w-full text-left border-collapse text-[11px] min-w-[800px]">
                <thead className="bg-slate-50 sticky top-0 z-20 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider">Project Details</th>
                    <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider text-center">Type</th>
                    <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider">Financial Status</th>
                    <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/40 transition-all group align-middle">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-8 rounded bg-slate-100 overflow-hidden relative border border-slate-200/50 flex-shrink-0">
                            {exp.mediaUrl ? (
                              exp.mediaType === 'IMAGE' ? (
                                <img src={exp.mediaUrl} alt={exp.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                  <video src={exp.mediaUrl} className="w-full h-full object-cover opacity-60" muted playsInline />
                                  <PlayCircle size={12} className="text-white absolute" />
                                </div>
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                {exp.type === 'CONSTRUCTION' ? <Construction size={16} /> : <PartyPopper size={16} />}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-slate-700 leading-snug group-hover:text-black transition-colors truncate">{exp.title}</p>
                            <p className="text-[10px] text-slate-400 mt-1 font-medium flex items-center italic">
                              <Calendar size={12} className="mr-1.5 opacity-50" />
                              {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : 'Unscheduled'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${exp.type === 'CONSTRUCTION' ? 'bg-amber-50 text-amber-700 border-amber-100/50' : 'bg-emerald-50 text-emerald-700 border-emerald-100/50'}`}>
                          {exp.type}
                        </span>
                      </td>
                      <td className="px-6 py-6 font-medium">
                        <div className="space-y-2">
                          <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                            <span>Progress: {getCostProgress(exp)}%</span>
                            <span className="text-slate-900">Rs. {getEstimatedCost(exp).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${getCostProgress(exp)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right pr-8">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/subadmin/accounts/projects/${exp.id}/edit`} className="p-2 text-slate-400 hover:text-[#1b4a50] hover:bg-teal-50 rounded-lg transition-all" title="Edit project">
                            <Edit3 size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(exp.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Remove project"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {dialog}
    </>
  );
}

function StatCard({ icon, tone, label, value }: { icon: React.ReactNode; tone: 'amber' | 'dark' | 'emerald' | 'rose'; label: string; value: string }) {
  const toneClass = {
    amber: 'bg-amber-50 text-[#dac48b]',
    dark: 'bg-slate-900 text-white',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-500',
  }[tone];

  return (
    <div className="bg-white px-4 py-3 rounded-md border border-slate-100 shadow-sm flex items-center space-x-3">
      <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${toneClass}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-900 tracking-tight truncate">{value}</p>
      </div>
    </div>
  );
}
