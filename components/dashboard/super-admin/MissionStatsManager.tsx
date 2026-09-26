'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  X,
  Sparkles,
  ArrowUpDown,
  Eye
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface MissionStat {
  id: string;
  target: number;
  prefix?: string;
  suffix?: string;
  label: string;
  desc: string;
  orderNo: number;
  isActive: boolean;
}

export default function MissionStatsManager() {
  const [stats, setStats] = useState<MissionStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStat, setEditingStat] = useState<MissionStat | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { dialog, confirmDialog, showAlert } = usePortalDialog();

  const [formData, setFormData] = useState({
    target: 0,
    prefix: '',
    suffix: '',
    label: '',
    desc: '',
    orderNo: 1,
    isActive: true,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/superadmin/mission-stats');
      const data = await res.json();
      if (Array.isArray(data)) {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch mission stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (stat: MissionStat) => {
    setEditingStat(stat);
    setFormData({
      target: stat.target,
      prefix: stat.prefix || '',
      suffix: stat.suffix || '',
      label: stat.label,
      desc: stat.desc,
      orderNo: stat.orderNo || 1,
      isActive: stat.isActive,
    });
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingStat(null);
    setFormData({
      target: 100,
      prefix: '',
      suffix: '+',
      label: '',
      desc: '',
      orderNo: stats.length + 1,
      isActive: true,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog({
      title: 'Delete this mission stat?',
      message: 'This impact figure will no longer appear in the mission statistics list.',
      confirmText: 'Delete stat',
      variant: 'danger',
    }))) return;
    try {
      const res = await fetch(`/api/superadmin/mission-stats?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStats(stats.filter(s => s.id !== id));
      } else {
        showAlert({ title: 'Failed to delete stat', message: 'Please try again after refreshing the dashboard.', variant: 'danger' });
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleToggleActive = async (stat: MissionStat) => {
    try {
      const res = await fetch('/api/superadmin/mission-stats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...stat, isActive: !stat.isActive }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStats(stats.map(s => s.id === stat.id ? updated : s));
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label || !formData.desc) {
      showAlert({ title: 'Missing details', message: 'Label and description are required.', variant: 'danger' });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/superadmin/mission-stats', {
        method: editingStat ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStat ? { ...formData, id: editingStat.id } : formData),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingStat(null);
        fetchStats();
        showAlert({
          title: editingStat ? 'Mission stat updated' : 'Mission stat created',
          message: 'Mission statistic has been synchronized successfully.',
          variant: 'success',
        });
      } else {
        const data = await res.json();
        showAlert({ title: 'Save failed', message: data.error || 'Failed to save mission statistic.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Unexpected error', message: 'Failed to save mission statistic.', variant: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="animate-spin text-blue-600" size={36} />
      </div>
    );
  }

  return (
    <>
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-blue-600" />
            Our Mission in Numbers
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage the live impact figures displayed on the user website homepage. Changes reflect instantly!
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
        >
          <Plus size={18} />
          Add New Stat
        </button>
      </div>

      {/* Form Modal/Section */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl relative animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => setShowForm(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X size={20} />
          </button>
          
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            {editingStat ? <Edit3 size={18} className="text-blue-600" /> : <Sparkles size={18} className="text-amber-500" />}
            {editingStat ? 'Edit Mission Stat' : 'Create New Mission Stat'}
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Target Number *</label>
              <input
                type="number"
                value={formData.target}
                onChange={e => setFormData({ ...formData, target: Number(e.target.value) })}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Prefix (e.g. $, #)</label>
              <input
                type="text"
                placeholder="Optional prefix"
                value={formData.prefix}
                onChange={e => setFormData({ ...formData, prefix: e.target.value })}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Suffix (e.g. +, Yrs, %)</label>
              <input
                type="text"
                placeholder="Optional suffix"
                value={formData.suffix}
                onChange={e => setFormData({ ...formData, suffix: e.target.value })}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Label Title *</label>
              <input
                type="text"
                placeholder="e.g. Students Currently Studying"
                value={formData.label}
                onChange={e => setFormData({ ...formData, label: e.target.value })}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Display Order #</label>
              <input
                type="number"
                value={formData.orderNo}
                onChange={e => setFormData({ ...formData, orderNo: Number(e.target.value) })}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Short Description *</label>
              <input
                type="text"
                placeholder="e.g. Across all 4 trust schools"
                value={formData.desc}
                onChange={e => setFormData({ ...formData, desc: e.target.value })}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              />
            </div>

            <div className="md:col-span-3 flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">Active (Show on Homepage)</span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {editingStat ? 'Update Stat' : 'Save Stat'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className={`relative bg-white border rounded-2xl p-6 shadow-sm transition-all flex flex-col justify-between group ${
              stat.isActive ? 'border-slate-200 hover:border-blue-300 hover:shadow-md' : 'border-dashed border-slate-300 bg-slate-50/70 opacity-75'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                  <ArrowUpDown size={12} />
                  Order: #{stat.orderNo}
                </span>
                <button
                  onClick={() => handleToggleActive(stat)}
                  title={stat.isActive ? 'Click to disable' : 'Click to enable'}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full transition ${
                    stat.isActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {stat.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {stat.isActive ? 'Active' : 'Hidden'}
                </button>
              </div>

              {/* Number Preview */}
              <div className="text-3xl font-extrabold text-blue-600 tracking-tight my-2">
                {stat.prefix || ''}
                {stat.target.toLocaleString('en-IN')}
                {stat.suffix || ''}
              </div>

              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 mt-2">
                {stat.label}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {stat.desc}
              </p>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => handleEdit(stat)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                <Edit3 size={14} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(stat.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 text-xs font-semibold rounded-lg transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {stats.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
            <Activity className="mx-auto h-10 w-10 text-slate-400 mb-3" />
            <p className="text-slate-600 font-medium">No mission stats found.</p>
            <button
              onClick={handleCreateNew}
              className="mt-3 inline-flex items-center gap-1.5 text-blue-600 font-semibold text-sm hover:underline"
            >
              <Plus size={16} /> Create your first stat
            </button>
          </div>
        )}
      </div>
    </div>
    {dialog}
    </>
  );
}
