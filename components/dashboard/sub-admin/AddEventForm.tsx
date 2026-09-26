'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  Plus
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

const DEFAULT_CATEGORIES = [
  'Annual Day',
  'Cultural',
  'School Life',
  'Campaign',
  'Sports',
  'Academics',
  'Excursion'
];

export default function AddEventForm() {
  const router = useRouter();
  const { dialog, showAlert } = usePortalDialog();

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState<string[]>([]);
  const [newPoint, setNewPoint] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Annual Day');
  const [customCategory, setCustomCategory] = useState('');
  const [existingCategories, setExistingCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch existing events to populate any custom categories previously created
    const fetchExisting = async () => {
      try {
        const res = await fetch('/api/subadmin/events');
        if (res.ok) {
          const events = await res.json();
          const catsFromEvents = events
            .map((e: any) => e.category)
            .filter(Boolean) as string[];
          const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...catsFromEvents]));
          setExistingCategories(combined);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchExisting();
  }, []);

  const handleAddPoint = () => {
    if (!newPoint.trim()) return;
    setPoints([...points, newPoint.trim()]);
    setNewPoint('');
  };

  const handleRemovePoint = (index: number) => {
    setPoints(points.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const finalCategory = category === 'NEW' 
      ? customCategory.trim() || 'General'
      : category;

    try {
      const res = await fetch('/api/subadmin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          tagline,
          description,
          points,
          featuredImage,
          date,
          category: finalCategory
        })
      });

      if (res.ok) {
        await showAlert({ title: 'Event created', message: 'Event details have been published successfully.', variant: 'success' });
        router.push('/subadmin/school-hub?tab=events');
      } else {
        const data = await res.json();
        showAlert({ title: 'Create failed', message: data.error || 'Failed to create event.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Create failed', message: 'Something went wrong while creating event.', variant: 'danger' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <div className="w-full mx-auto py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Navigation */}
      <div className="mb-6">
        <Link
          href="/subadmin/school-hub?tab=events"
          className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-[#18181b] transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Events
        </Link>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create New Event</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Add event details, tagline, highlights, category, and date for your school</p>
          </div>
          <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center text-[#18181b]">
            <CalendarDays size={24} />
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Event Title */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Event Title <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Cultural Day 2026"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#18181b]/20 focus:border-[#18181b] transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Event Tagline */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Event Tagline (Optional)
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. A Night to Remember"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#18181b]/20 focus:border-[#18181b] transition-all shadow-sm"
            />
          </div>

          {/* Category Dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Event Category <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#18181b]/20 focus:border-[#18181b] transition-all shadow-sm"
              >
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="NEW">+ Add New Category...</option>
              </select>
            </div>

            {/* Custom Category Input */}
            {category === 'NEW' && (
              <div className="pt-2 animate-in fade-in duration-200">
                <label className="block text-[11px] font-bold text-[#18181b] uppercase tracking-wider mb-1">
                  New Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Science & Innovation Fair"
                  className="w-full px-4 py-3 bg-slate-50 border border-[#18181b] rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#18181b]/20 transition-all shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Date Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Event Date <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#18181b]/20 focus:border-[#18181b] transition-all shadow-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the event, scheduled activities, or highlights..."
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#18181b]/20 focus:border-[#18181b] transition-all shadow-sm resize-none"
            />
          </div>

          {/* Points / Highlights List */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Key Event Points / Highlights (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPoint}
                onChange={(e) => setNewPoint(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPoint(); } }}
                placeholder="e.g. 500+ Attendees Each Year"
                className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#18181b]/20 focus:border-[#18181b] transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={handleAddPoint}
                className="px-4 py-3 bg-[#18181b] hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1"
              >
                <Plus size={16} /> Add Point
              </button>
            </div>
            {points.length > 0 && (
              <div className="space-y-2 pt-2">
                {points.map((pt, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-medium text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#18181b]" />
                      {pt}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePoint(i)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Featured Image URL Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Featured Cover Image URL (Optional)
            </label>
            <input
              type="text"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="e.g. https://images.unsplash.com/... or Cloudinary URL"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#18181b]/20 focus:border-[#18181b] transition-all shadow-sm"
            />
            {featuredImage && (
              <div className="mt-2 relative w-40 h-24 rounded-xl overflow-hidden border border-slate-300 shadow-sm">
                <img src={featuredImage} alt="Featured preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200">
            <Link
              href="/subadmin/school-hub?tab=events"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center px-6 py-2.5 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Creating Event...
                </>
              ) : (
                'Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    {dialog}
    </>
  );
}
