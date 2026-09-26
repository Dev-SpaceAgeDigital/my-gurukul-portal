'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  Trash2,
  Loader2,
  Save,
  Edit3
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface AcademicYear {
  id: string;
  label: string;
  isActive: boolean;
  statusTag: string;
  createdAt: string;
}

interface Props {
  schoolId?: string;
  isAdmin?: boolean;
}

export default function AcademicYearManager({ schoolId, isAdmin = false }: Props) {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [newYear, setNewYear] = useState({ label: '', isActive: false, statusTag: 'CURRENT' });
  const { dialog, showAlert } = usePortalDialog();

  useEffect(() => {
    fetchYears();
  }, [schoolId]);

  const fetchYears = async () => {
    try {
      const url = isAdmin
        ? `/api/superadmin/academic-years${schoolId ? `?schoolId=${schoolId}` : ''}`
        : '/api/subadmin/academic-years';
      const response = await fetch(url);
      const data = await response.json();
      if (Array.isArray(data)) {
        setYears(data);
      } else {
        showAlert({ title: 'Load failed', message: data.error || 'Failed to load academic years.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Communication failed', message: 'Failed to load academic years.', variant: 'danger' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYear.label) return;

    setIsSubmitting(true);

    try {
      const url = isAdmin ? '/api/superadmin/academic-years' : '/api/subadmin/academic-years';
      const response = await fetch(url, {
        method: editingYear ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingYear ? { ...newYear, id: editingYear.id } : newYear),
      });

      if (response.ok) {
        setNewYear({ label: '', isActive: false, statusTag: 'CURRENT' });
        setEditingYear(null);
        fetchYears();
        showAlert({ title: editingYear ? 'Academic year updated' : 'Academic year created', message: 'Academic year registry has been synchronized successfully.', variant: 'success' });
      } else {
        const data = await response.json();
        showAlert({ title: 'Save failed', message: data.error || 'Failed to save academic year.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Unexpected error', message: 'Failed to save academic year.', variant: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-[#1A3D63]" size={32} />
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Academic years</h2>
          <p className="text-xs text-slate-500 font-medium tracking-tight">Manage the academic calendar for institutional promotions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creation Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sticky top-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
              <Plus size={20} className="mr-3 text-[#1A3D63]" />
              {editingYear ? 'Update year' : 'New academic year'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500 ml-1">
                  Year
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2024-25"
                  value={newYear.label}
                  onChange={(e) => setNewYear({ ...newYear, label: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1A3D63]/10 outline-none transition-all font-semibold text-sm bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500 ml-1">
                  Year status tag
                </label>
                <select
                  value={newYear.statusTag}
                  onChange={(e) => setNewYear({ ...newYear, statusTag: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1A3D63]/10 outline-none transition-all font-semibold text-sm bg-slate-50 focus:bg-white"
                >
                  <option value="PREVIOUS">Previous Year</option>
                  <option value="CURRENT">Current Year</option>
                  <option value="UPCOMING">Upcoming Year</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newYear.isActive}
                  onChange={(e) => setNewYear({ ...newYear, isActive: e.target.checked })}
                  className="w-5 h-5 text-[#1A3D63] rounded-lg border-slate-300 focus:ring-[#1A3D63]"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-600 cursor-pointer">
                  Set as active year
                </label>
              </div>

              {/* Page Actions - Unified Alignment */}
              <div className="flex justify-between items-center pt-2">
                 <div className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-semibold text-slate-500 flex items-center">
                    <Clock size={12} className="mr-1.5" />
                    Registry timeline
                 </div>
                 <button
                   type="button"
                   onClick={() => {
                     setEditingYear(null);
                     setNewYear({ label: '', isActive: false, statusTag: 'CURRENT' });
                   }}
                   className="bg-[#1A3D63] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#0A1931] transition text-xs shadow-sm shadow-[#1A3D63]/10 flex items-center group"
                 >
                   <div className="bg-white/10 p-1 rounded-lg mr-2 group-hover:scale-110 transition-transform">
                     <Plus size={16} strokeWidth={3} />
                   </div>
                   New year
                 </button>
              </div>

              <div className="flex space-x-3 py-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] bg-[#1A3D63] text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-[#1A3D63]/10 hover:bg-[#0A1931] transition-all flex items-center justify-center disabled:opacity-50 text-xs"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                  {editingYear ? 'Update year' : 'Create year'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Years List - Transitioned to Professional Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full table-fixed min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-left w-[40%]">Academic year</th>
                      <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-left w-[30%]">Current status</th>
                      <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-right w-[30%] pr-8">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {years.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                           No academic years defined in registry.
                        </td>
                      </tr>
                    ) : (
                      years.map((year) => (
                        <tr key={year.id} className={`hover:bg-slate-50/40 transition-all group align-middle ${year.isActive ? 'bg-indigo-50/20' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3.5">
                              <div className={`p-2.5 rounded-xl border transition-all ${year.isActive ? 'bg-[#1A3D63] text-white border-[#1A3D63]' : 'bg-slate-50 text-slate-300 border-slate-200/60'}`}>
                                <Calendar size={18} strokeWidth={1.5} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[13px] font-semibold text-slate-700 leading-snug">{year.label}</h4>
                                <p className="text-[9px] text-slate-400 mt-1 font-medium italic">
                                   Registry: {new Date(year.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center space-x-2">
                                <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border flex items-center space-x-1.5 ${
                                  year.statusTag === 'CURRENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' :
                                  year.statusTag === 'PREVIOUS' ? 'bg-slate-100 text-slate-600 border-slate-200/50' :
                                  'bg-amber-50 text-amber-700 border-amber-100/50'
                                }`}>
                                   <div className={`w-1.5 h-1.5 rounded-full ${
                                      year.statusTag === 'CURRENT' ? 'bg-emerald-500' :
                                      year.statusTag === 'PREVIOUS' ? 'bg-slate-400' :
                                      'bg-amber-500'
                                   }`} />
                                   <span>{year.statusTag || 'CURRENT'}</span>
                                </span>
                                {year.isActive && (
                                  <span className="px-2.5 py-1 bg-[#1A3D63] text-white text-[10px] font-semibold rounded-lg shadow-md shadow-[#1A3D63]/10">
                                    Active
                                  </span>
                                )}
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right pr-8 relative">
                             <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col space-y-1 px-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                <button
                                  onClick={() => {
                                    setEditingYear(year);
                                    setNewYear({ label: year.label, isActive: year.isActive, statusTag: year.statusTag || 'CURRENT' });
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-[#1A3D63] hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg transition-all"
                                  title="Modify Academic Context"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all"
                                  title="Delete Permanent"
                                >
                                  <Trash2 size={14} />
                                </button>
                             </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>
    </div>
    {dialog}
    </>
  );
}
