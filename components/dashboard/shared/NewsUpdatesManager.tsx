'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Edit3, Image as ImageIcon, Loader2, Megaphone, Plus, Trash2, X } from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

type Role = 'SUPER_ADMIN' | 'SUB_ADMIN';

interface SchoolOption {
  id: string;
  schoolName: string;
}

interface NewsUpdate {
  id: string;
  title: string;
  description: string;
  category: string;
  publishDate: string | null;
  imageUrl: string | null;
  schoolId: string | null;
  schoolName?: string | null;
  isActive: boolean;
  createdAt: string;
}

const categories = ['Announcement', 'Event', 'School News', 'Achievement', 'Notice'];

const emptyForm = {
  id: '',
  title: '',
  description: '',
  category: 'Announcement',
  publishDate: '',
  schoolId: '',
  isActive: true,
  file: null as File | null,
};

export default function NewsUpdatesManager({ role }: { role: Role }) {
  const [updates, setUpdates] = useState<NewsUpdate[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { dialog, confirmDialog, showAlert } = usePortalDialog();

  useEffect(() => {
    fetchUpdates();
    if (role === 'SUPER_ADMIN') fetchSchools();
  }, [role]);

  const fetchUpdates = async () => {
    try {
      const res = await fetch('/api/admin/news-updates');
      const data = await res.json();
      if (res.ok) setUpdates(Array.isArray(data) ? data : []);
      else showAlert({ title: 'Load failed', message: data.error || 'Unable to load updates.', variant: 'danger' });
    } catch {
      showAlert({ title: 'Communication failed', message: 'Unable to load updates.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const res = await fetch('/api/admin/schools');
      const data = await res.json();
      if (res.ok) setSchools(Array.isArray(data) ? data : []);
    } catch {
      // School selection is optional for superadmin posts.
    }
  };

  const resetForm = () => setForm(emptyForm);

  const submitUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const body = new FormData();
      body.append('title', form.title);
      body.append('description', form.description);
      body.append('category', form.category);
      body.append('publishDate', form.publishDate);
      body.append('schoolId', form.schoolId);
      body.append('isActive', String(form.isActive));
      if (form.id) body.append('id', form.id);
      if (form.file) body.append('file', form.file);

      const res = await fetch('/api/admin/news-updates', {
        method: form.id ? 'PATCH' : 'POST',
        body,
      });
      const data = await res.json();

      if (!res.ok) {
        showAlert({ title: 'Save failed', message: data.error || 'Unable to save update.', variant: 'danger' });
        return;
      }

      resetForm();
      fetchUpdates();
    } catch {
      showAlert({ title: 'Save failed', message: 'Unable to save update.', variant: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  const editUpdate = (update: NewsUpdate) => {
    setForm({
      id: update.id,
      title: update.title,
      description: update.description,
      category: update.category,
      publishDate: update.publishDate || '',
      schoolId: update.schoolId || '',
      isActive: update.isActive,
      file: null,
    });
  };

  const deleteUpdate = async (id: string) => {
    if (!(await confirmDialog({
      title: 'Delete this homepage update?',
      message: 'This update will be removed from the homepage updates list.',
      confirmText: 'Delete update',
      variant: 'danger',
    }))) return;

    try {
      const res = await fetch(`/api/admin/news-updates?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchUpdates();
    } catch {
      showAlert({ title: 'Delete failed', message: 'Unable to delete update.', variant: 'danger' });
    }
  };

  return (
    <>
    <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-5 h-full min-h-0">
      <form onSubmit={submitUpdate} className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full min-h-0 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{form.id ? 'Edit update' : 'Create update'}</h2>
            <p className="text-xs font-medium text-slate-500 mt-1">Publish news, events, and announcements.</p>
          </div>
          {form.id && (
            <button type="button" onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-4 focus:ring-[#3f72af]/10">
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Title</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-4 focus:ring-[#3f72af]/10" placeholder="e.g. Annual trust day announced" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Description</label>
          <textarea required rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none resize-none focus:ring-4 focus:ring-[#3f72af]/10" placeholder="Short homepage summary..." />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Publish date</label>
            <input type="date" value={form.publishDate} onChange={(e) => setForm({ ...form, publishDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-4 focus:ring-[#3f72af]/10" />
          </div>

          {role === 'SUPER_ADMIN' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">School</label>
              <select value={form.schoolId} onChange={(e) => setForm({ ...form, schoolId: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-4 focus:ring-[#3f72af]/10">
                <option value="">All Schools</option>
                {schools.map((school) => <option key={school.id} value={school.id}>{school.schoolName}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Image</label>
          <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold outline-none file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:rounded-lg" />
        </div>

        <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 cursor-pointer">
          <span className="text-sm font-bold text-slate-700">Visible on userside</span>
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4" />
        </label>
        </div>

        <div className="p-5 border-t border-slate-100 bg-white shrink-0">
        <button disabled={submitting} className="w-full flex items-center justify-center px-4 py-3 bg-[#18181b] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black disabled:opacity-50">
          {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
          {form.id ? 'Save update' : 'Publish update'}
        </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full min-h-0 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Homepage updates</h2>
            <p className="text-xs font-medium text-slate-500 mt-1">Shown in Latest from Madni Islamic Study Centre.</p>
          </div>
          <Megaphone size={20} className="text-slate-400" />
        </div>

        {loading ? (
          <div className="flex-1 min-h-0 py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="animate-spin mb-3" size={28} />
            <p className="text-xs font-bold uppercase tracking-wider">Loading updates...</p>
          </div>
        ) : updates.length === 0 ? (
          <div className="flex-1 min-h-0 py-20 flex flex-col items-center justify-center text-slate-400">
            <Megaphone size={34} className="mb-3 text-slate-200" />
            <p className="text-sm font-bold text-slate-700">No updates yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {updates.map((update) => (
              <div key={update.id} className="p-5 flex flex-col lg:flex-row gap-4 lg:items-center">
                <div className="w-full lg:w-32 aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                  {update.imageUrl ? <img src={update.imageUrl} alt={update.title} className="w-full h-full object-cover" /> : <ImageIcon size={22} className="text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">{update.category}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${update.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {update.isActive ? 'Live' : 'Hidden'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 truncate">{update.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mt-1">{update.description}</p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 font-semibold mt-2">
                    <span className="flex items-center"><Calendar size={12} className="mr-1.5" />{update.publishDate || new Date(update.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center"><CheckCircle2 size={12} className="mr-1.5" />{update.schoolName || 'All Schools'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => editUpdate(update)} className="p-2 text-slate-400 hover:text-[#3f72af] hover:bg-slate-50 rounded-lg border border-slate-200" title="Edit">
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => deleteUpdate(update.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200" title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    {dialog}
    </>
  );
}
