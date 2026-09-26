'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Plus,
  Trash2,
  Edit3,
  X,
  Loader2,
  ChevronRight,
  IndianRupee,
  Activity
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface Standard {
  id: string;
  standardName: string;
  division: string | null;
  stream?: string | null;
  fees: string | number;
  batchYear: string | null;
}

interface AcademicYear {
  id: string;
  label: string;
  statusTag: string;
}

export default function StandardManagement() {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStandard, setEditingStandard] = useState<Standard | null>(null);
  const { dialog, confirmDialog, showAlert } = usePortalDialog();

  // Form State
  const [formData, setFormData] = useState({
    standardName: '',
    division: '',
    stream: '',
    fees: '',
    batchYear: '',
  });

  useEffect(() => {
    fetchStandards();
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      const res = await fetch('/api/subadmin/academic-years');
      const data = await res.json();
      if (res.ok) setAcademicYears(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStandards = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subadmin/standards');
      const data = await res.json();
      if (res.ok) setStandards(data);
      else showAlert({ title: 'Load failed', message: data.error || 'Unable to load academic standards.', variant: 'danger' });
    } catch (err) {
      showAlert({ title: 'Connection failure', message: 'Unable to load academic standards.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/subadmin/standards', {
        method: editingStandard ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fees: parseFloat(formData.fees) || 0,
          id: editingStandard?.id
        }),
      });

      if (res.ok) {
        setShowAddForm(false);
        setEditingStandard(null);
        resetForm();
        fetchStandards();
      } else {
        const data = await res.json();
        showAlert({ title: 'Save failed', message: data.error || 'Academic standard could not be saved.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Network synchronization error', message: 'Academic standard could not be saved.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog({
      title: 'Remove this academic standard?',
      message: 'This standard will be permanently removed from the class setup.',
      confirmText: 'Remove standard',
      variant: 'danger',
    }))) return;
    try {
      const res = await fetch('/api/subadmin/standards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchStandards();
    } catch (err) {
      showAlert({ title: 'Deletion failed', message: 'The academic standard could not be removed.', variant: 'danger' });
    }
  };

  const handleEdit = (std: Standard) => {
    setEditingStandard(std);
    setFormData({
      standardName: std.standardName,
      division: std.division || '',
      stream: std.stream || '',
      fees: std.fees.toString(),
      batchYear: std.batchYear || '',
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      standardName: '',
      division: '',
      stream: '',
      fees: '',
      batchYear: '',
    });
  };

  return (
    <>
    <div className="lg:h-full lg:overflow-hidden flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-md border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Academic Standards</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Grade configuration and institutional fee structures</p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditingStandard(null); resetForm(); }}
          className="bg-[#18181b] text-white px-4 py-2 rounded-md hover:bg-black transition font-bold text-[11px] shadow-sm flex items-center w-fit uppercase tracking-wider"
        >
          <Plus size={16} className="mr-2" />
          <span>Add Standard</span>
        </button>
      </div>

      {/* Standards List Container */}
      <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse text-[11px] min-w-[800px]">
            <thead className="bg-slate-50 sticky top-0 z-20 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider">Standards</th>
                <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider">Annual Fees</th>
                <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider text-center">Academic Year</th>
                <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && !standards.length ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center"><Loader2 className="animate-spin text-[#dac48b] mx-auto" size={24} /></td></tr>
              ) : standards.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm italic">No academic standards localized.</td></tr>
              ) : (
                standards.map(std => (
                  <tr key={std.id} className="hover:bg-slate-50/40 transition-all group align-middle">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-[#dac48b] transition-all shrink-0">
                          <Layers size={16} strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-slate-700 leading-snug group-hover:text-black transition-colors">{std.standardName} {std.stream ? `(${std.stream})` : ''}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium italic">Div: {std.division || 'Main'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center space-x-1 font-bold text-slate-700 tabular-nums">
                          <IndianRupee size={13} className="text-[#dac48b]" />
                          <span className="text-[13px]">{parseFloat(std.fees as string).toLocaleString('en-IN')}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className="px-2 py-1 bg-amber-50 text-[#a98f4a] text-[10px] font-bold rounded-md border border-amber-100/50">
                          {std.batchYear || 'Floating'}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right pr-8">
                       <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => handleEdit(std)} className="p-1.5 text-slate-400 hover:text-black hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-md transition-all" title="Modify Context">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleDelete(std.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-md transition-all" title="Delete Policy">
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

      {/* Config Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#FAF7F0] w-full max-w-md rounded-md shadow-2xl p-8 relative border border-[#E6DFD3]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{editingStandard ? 'Update Standard' : 'Define Standard'}</h3>
                <p className="text-slate-500 text-xs font-medium mt-0.5 uppercase tracking-wide">Institutional academic control center</p>
              </div>
              <button onClick={() => setShowAddForm(false)} className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Standard Identity (e.g., 10th)</label>
                <input type="text" required value={formData.standardName} onChange={e => setFormData({ ...formData, standardName: e.target.value })} className="w-full px-4 py-2 rounded-md outline-none focus:ring-2 focus:ring-[#dac48b]/20 text-sm transition-all" placeholder="Enter Grade" />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Assigned Divisions (e.g., A, B, C)</label>
                <input type="text" value={formData.division} onChange={e => setFormData({ ...formData, division: e.target.value })} className="w-full px-4 py-2 rounded-md outline-none focus:ring-2 focus:ring-[#dac48b]/20 text-sm transition-all" placeholder="Separated by commas" />
              </div>

              {(formData.standardName.trim().toLowerCase() === '11th' || formData.standardName.trim().toLowerCase() === '12th') && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Stream</label>
                  <select
                    value={formData.stream}
                    onChange={e => setFormData({ ...formData, stream: e.target.value })}
                    className="w-full px-4 py-2 rounded-md outline-none focus:ring-2 focus:ring-[#dac48b]/20 text-sm transition-all"
                    required
                  >
                    <option value="">Select Stream</option>
                    <option value="Science">Science</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Arts">Arts</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Annual fees</label>
                <div className="relative group">
                  <IndianRupee size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#dac48b] transition-colors" />
                  <input type="number" required value={formData.fees} onChange={e => setFormData({ ...formData, fees: e.target.value })} className="w-full pl-10 pr-4 py-2 rounded-md outline-none focus:ring-2 focus:ring-[#dac48b]/20 text-sm transition-all" placeholder="0.00" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Academic batch (e.g., 2024-25)</label>
                <select
                  value={formData.batchYear}
                  onChange={e => setFormData({ ...formData, batchYear: e.target.value })}
                  className="w-full px-4 py-2 rounded-md outline-none focus:ring-2 focus:ring-[#dac48b]/20 text-sm transition-all"
                  required
                >
                  <option value="">Select an Academic Year</option>
                  {academicYears.map(year => (
                    <option key={year.id} value={year.label}>
                      {year.label} {year.statusTag ? `(${year.statusTag})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-6">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-md font-bold text-[11px] uppercase tracking-wider hover:bg-slate-200 transition-all">Abort</button>
                <button type="submit" disabled={loading} className="flex-[2] py-3 bg-[#18181b] text-white rounded-md font-bold text-[11px] uppercase tracking-wider shadow-sm hover:bg-black transition-all active:scale-95">
                  {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : <span>{editingStandard ? 'Update Policy' : 'Authorize Standard'}</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    {dialog}
    </>
  );
}
